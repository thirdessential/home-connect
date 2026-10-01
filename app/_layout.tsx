import { useFonts } from "expo-font";
import { Stack, router, useNavigationContainerRef, useRouter } from "expo-router";
import { StatusBar } from "react-native";
import { useEffect, useRef } from "react";
import { AppState, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import "../global.css";
import { manropeAssets } from "../theme/fonts";

// App-wide default so any raw <Text>/<TextInput> without an explicit
// fontFamily (i.e. not going through theme.typography/uiTheme tokens) still
// renders Manrope instead of falling back to the platform system font.
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.style = [{ fontFamily: "Manrope_400Regular" }, (Text as any).defaultProps.style];
(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps.style = [{ fontFamily: "Manrope_400Regular" }, (TextInput as any).defaultProps.style];

import {
  ThemeProvider as AppThemeProvider,
  navFromTheme,
  useTheme as useAppTheme,
} from "../theme/theme";

import { ThemeProvider as NavigationThemeProvider } from "expo-router";
import CreatePostModal from "../components/common/createPostModal";
import ConfigWarningBanner from "../components/common/ConfigWarningBanner";
import InternetStatusStrip from "../components/common/InternetStatusStrip";
import { ToastProvider, useToast } from "../components/common/Toast";
import { ImageUploadProvider } from "../components/image-upload";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useAuthStore } from "../store/useAuthStore";
import { useUiStore } from "../store/useUiStore";
import { useUserStore } from "../store/useUserStore";
import { UserRole } from "../types/roles";

export default function RootLayout() {
  const [fontsLoaded] = useFonts(manropeAssets);
  if (!fontsLoaded) return null; // keep native splash up until Manrope is ready

  return (
    <AppThemeProvider forceScheme="light">
      <NavLinker />
    </AppThemeProvider>
  );
}

function NavLinker() {
  usePushNotifications();
  const t = useAppTheme();
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();

  const modalVisible = useUiStore((s) => s.createPostModal.visible);
  const modalInitialForm = useUiStore((s) => s.createPostModal.initialForm);
  const closeCreatePostModal = useUiStore((s) => s.closeCreatePostModal);

  const { _hasHydrated, token, expiresAt, roles } = useAuthStore();
  const userStoreHydrated = useUserStore((s) => s._hasHydrated);

  // Primary auth redirect — waits for both store hydration AND navigator ready
  useEffect(() => {
    if (!_hasHydrated || !userStoreHydrated) return;

    const redirect = () => {
      const isExpired = expiresAt
        ? new Date(expiresAt).getTime() <= Date.now()
        : false;

      const loggedIn = !!token && !isExpired;
      if (!loggedIn) {
        router.replace("/(auth)/login");
        return;
      }

      // Backend user is the source of truth for society membership. Admins
      // don't go through society onboarding; everyone else without a
      // societyId must select one — never fall through to Home/guest.
      const isAdmin =
        roles?.includes(UserRole.ADMIN) || roles?.includes(UserRole.SUPER_ADMIN);
      const hasSociety = !!useUserStore.getState().user?.societyId;
      router.replace(
        isAdmin || hasSociety ? "/(tabs)/home" : "/onboarding/select-society",
      );
    };

    if (navigationRef.isReady()) {
      redirect();
    } else {
      const unsub = navigationRef.addListener("state", () => {
        if (navigationRef.isReady()) {
          unsub();
          redirect();
        }
      });
      return unsub;
    }
  }, [_hasHydrated, userStoreHydrated]);

  // Background session check — runs after redirect, only when token exists
  useEffect(() => {
    if (!_hasHydrated || !token) return;

    const timer = setTimeout(async () => {
      const authState = useAuthStore.getState();

      if (
        !authState.token ||
        authState.isSendingOtp ||
        authState.isVerifyingOtp
      )
        return;

      // Validates the stored session: refreshes an expired/near-expiry access
      // token (or migrates a legacy one) and syncs the user. Offline = no logout.
      try {
        await authState.initSession();
      } catch (error) {
        console.warn(
          "Session restoration failed, keeping token for offline use:",
          error,
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [_hasHydrated, token]);

  // App-wide resume refresh: HomeScreen already refetches on its own focus,
  // but that only fires while the Home tab is active. Mounting this at the
  // root instead means an admin approval lands as soon as the app comes back
  // to foreground no matter which tab the user is on — same existing
  // fetchUser action, just one more trigger for it.
  useEffect(() => {
    if (!_hasHydrated || !token) return;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      // Back from background: renew the access token if it is near expiry and
      // rotate the refresh token if it is in its final 5 days.
      useAuthStore.getState().ensureFreshToken().catch(() => {});
      const userId = useUserStore.getState().user?._id;
      if (userId) useUserStore.getState().fetchUser(userId).catch(() => {});
    });
    return () => sub.remove();
  }, [_hasHydrated, token]);

  return (
    <NavigationThemeProvider value={navFromTheme(t)}>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <SafeAreaProvider>
          <ToastProvider>
          <SessionWatcher />
          <ImageUploadProvider>
              {/* <StatusBarBackdrop /> */}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: t.colors.white },
            }}
          >
            {/* Auth flow */}
            <Stack.Screen name="(auth)" />
            {/* Main app tabs */}
            <Stack.Screen name="(tabs)" />
            {/* Shared screens accessible from any tab */}
            <Stack.Screen name="(shared)" />
          </Stack>
          <ConfigWarningBanner />
          {/* Globally mounted CreatePostModal to avoid tab-induced re-renders */}
          <InternetStatusStrip />
          <CreatePostModal
            visible={modalVisible}
            initialForm={modalInitialForm}
            onClose={closeCreatePostModal}
          />
          </ImageUploadProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </NavigationThemeProvider>
  );
}

// Sends the user to Login whenever a signed-in session ends (token goes from
// set -> null), and explains why when the cause was an unrecoverable session.
function SessionWatcher() {
  const { showToast } = useToast();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const prevToken = useRef<string | null>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!seeded.current) {
      // First hydrated value is the restored session, not a logout.
      seeded.current = true;
      prevToken.current = token;
      return;
    }
    if (prevToken.current && !token) {
      const st = useAuthStore.getState();
      if (st.sessionExpired) {
        showToast("Your session has expired. Please log in again.", "error");
        st.clearSessionExpired();
      }
      router.replace("/(auth)/login");
    }
    prevToken.current = token;
  }, [token, hydrated, showToast]);

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
