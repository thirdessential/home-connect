import { Post } from "@/lib/httpMethods";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useUserStore } from "@/store/useUserStore";
import Constants from "expo-constants";
// Type-only import: erased at compile time, so it never triggers the native
// module to load. The real (value) module is `require`d lazily below, only
// after confirming we're not in Expo Go, so Expo Go never evaluates it.
import type * as NotificationsType from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import { AppState } from "react-native";

// Remote push (getExpoPushTokenAsync / native push registration) was removed
// from Expo Go in SDK 53+ and throws there. Local scheduling/handling still
// works in Expo Go; only skip the remote-push parts when running in Expo Go.
const isExpoGo = Constants.appOwnership === "expo";

let configured = false;
let registeredForUserId: string | undefined; // dedupe permission/token work per login session
let registrationInFlightForUserId: string | undefined;
let registeredToken: string | undefined;

/** Sends one real remote push from a development build to verify the token.
 * Never runs in production; this endpoint does not require an app secret. */
async function sendDevelopmentTestPush(token: string) {
  if (!__DEV__) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: token,
      title: "Home Connect test notification",
      body: `Push is working on ${Platform.OS === "ios" ? "iOS" : "Android"}.`,
      data: { path: "/(shared)/notifications", test: true },
      sound: "default",
      channelId: "home_connect_default",
      priority: "high",
    }),
  });

  const result = await response.json();
  if (!response.ok || result?.data?.status === "error") {
    throw new Error(`Expo test push failed: ${JSON.stringify(result)}`);
  }
  console.log("[Push] development test push sent", result);

  // A successful ticket means Expo accepted the request, not that FCM
  // delivered it. Read the receipt so Android credential/token failures are
  // visible in the device log instead of looking like a silent notification.
  const receiptId = result?.data?.id;
  if (!receiptId) return;
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const receiptResponse = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [receiptId] }),
  });
  const receiptResult = await receiptResponse.json();
  console.log("[Push] development test push receipt", receiptResult);
}

export async function sendDevelopmentTestPushToCurrentDevice() {
  if (!__DEV__) throw new Error("Test push is available only in development builds");
  if (isExpoGo) {
    // Expo Go cannot create a remote Expo/APNs token, but it can still verify
    // that permission and on-device notification display work.
    const Notifications = require("expo-notifications") as typeof NotificationsType;
    const { status: existing } = await Notifications.getPermissionsAsync();
    const { status } = existing === "granted"
      ? { status: existing }
      : await Notifications.requestPermissionsAsync();
    if (status !== "granted") throw new Error("Notification permission was not granted");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Home Connect local test",
        body: "On-device notifications are working in Expo Go.",
        sound: "default",
      },
      trigger: null,
    });
    return;
  }
  if (!registeredToken) throw new Error("No push token is registered on this device yet");
  // A valid Expo ticket/receipt only proves server→FCM delivery, not that
  // Android will actually display it — that's gated by the OS-level
  // notification permission (Settings > Apps > Home Connect > Notifications).
  // Re-check it here so a disabled permission fails loudly instead of
  // reporting a false "sent" success.
  const Notifications = require("expo-notifications") as typeof NotificationsType;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    throw new Error(
      "Notifications are disabled for this app in Android system settings. Enable them in Settings > Apps > Home Connect > Notifications, then try again.",
    );
  }
  await sendDevelopmentTestPush(registeredToken);
}

/** Requests permission, registers the Expo push token with the existing
 * backend (/api/notification/user/register-token), and wires foreground +
 * tap listeners into the local notification store. Mount once at the root.
 * Browser builds request browser notification permission, while native remote
 * push registration runs only on a physical device. */
export function usePushNotifications() {
  const userId = useUserStore((s) => s.user?._id);
  const add = useNotificationStore((s) => s.add);
  const receivedSub = useRef<NotificationsType.EventSubscription | null>(null);
  const responseSub = useRef<NotificationsType.EventSubscription | null>(null);

  useEffect(() => {
    if (__DEV__) {
      console.log(`[Push] environment: ${isExpoGo ? "Expo Go" : "Dev/Prod Build"}`);
      console.log(`[Push] authenticated user: ${userId ? "yes" : "no"}`);
    }
    if (!userId) {
      registeredForUserId = undefined;
      registrationInFlightForUserId = undefined;
      registeredToken = undefined;
      return;
    }

    // expo-notifications does not provide native Expo/FCM tokens on web.
    // Still request the browser permission so PC users get a clear prompt;
    // server push for web requires a separate Web Push/FCM web token.
    if (Platform.OS === "web") {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        void Notification.requestPermission().then((status) => {
          if (__DEV__) console.log(`[Push] browser permission: ${status}`);
        });
      }
      if (__DEV__) console.log("[Push] web build: native token registration skipped");
      return;
    }

    if (isExpoGo) {
      if (__DEV__) console.log("[Push] skipped: remote push unsupported in Expo Go, use a dev build");
      return;
    }

    if (!Device.isDevice) {
      if (__DEV__) console.log("[Push] skipped: push tokens require a physical device");
      return;
    }

    const Notifications = require("expo-notifications") as typeof NotificationsType;

    if (!configured) {
      configured = true;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }

    const registerToken = async () => {
      if (
        registeredForUserId === userId ||
        registrationInFlightForUserId === userId
      ) return;

      registrationInFlightForUserId = userId;

      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (existing !== "granted") {
          ({ status } = await Notifications.requestPermissionsAsync());
        }
        if (__DEV__) console.log(`[Push] permission: ${status}`);
        if (status !== "granted") return;

        if (Platform.OS === "android") {
          // Android notification channel importance is immutable after
          // creation — re-calling setNotificationChannelAsync on an existing
          // channel ID never changes it. This app has been reinstalled over
          // (not uninstalled) many times this week while the channel was
          // configured at lower importance, so a device that first created
          // "default" back then is silently stuck there even though this
          // code now asks for MAX. A new channel ID forces a fresh channel.
          await Notifications.setNotificationChannelAsync("home_connect_default", {
            name: "Home Connect",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          });
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const { data: token } = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        if (!token) throw new Error("Push token was empty");
        if (__DEV__ && token) console.log(`FCM/Expo Push Token: ${token}`); // dev-only — never logged/returned in production
        await Post("/api/notification/user/register-token", { token });
        // Set this only after the server confirms registration. Failed
        // requests must be retried, otherwise sends permanently report no
        // tokens for this user until the app is reinstalled.
        registeredToken = token;
        registeredForUserId = userId;
        if (__DEV__) console.log("[Push] token registration: success");
        try {
          await sendDevelopmentTestPush(token);
        } catch (e) {
          // A test-send failure must not make a valid registration look like
          // a missing token or prevent future app-side retries.
          if (__DEV__) console.log("[Push] development test push failure", e);
        }
      } catch (e) {
        if (__DEV__) console.log("[Push] token registration: failure", e);
      } finally {
        registrationInFlightForUserId = undefined;
      }
    };

    void registerToken();

    // Foreground: capture into the local store (also shown via the handler above).
    receivedSub.current = Notifications.addNotificationReceivedListener((n) => {
      if (__DEV__) console.log("[Push] notification received");
      add({
        title: n.request.content.title ?? "Notification",
        body: n.request.content.body ?? "",
        data: n.request.content.data as Record<string, any>,
        receivedAt: new Date().toISOString(),
      });
    });

    // Tap (foreground, background, or cold start): record + deep-link.
    responseSub.current = Notifications.addNotificationResponseReceivedListener((res) => {
      if (__DEV__) console.log("[Push] notification tapped");
      const content = res.notification.request.content;
      add({
        title: content.title ?? "Notification",
        body: content.body ?? "",
        data: content.data as Record<string, any>,
        receivedAt: new Date().toISOString(),
      });
      const path = (content.data as any)?.path;
      if (typeof path === "string") router.push(path as any);
      else router.push("/(shared)/notifications" as any);
    });
    if (__DEV__) console.log("[Push] listener registered");

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active" && registeredForUserId !== userId) {
        void registerToken();
      }
    });

    return () => {
      receivedSub.current?.remove();
      responseSub.current?.remove();
      appStateSub.remove();
    };
  }, [userId, add]);
}
