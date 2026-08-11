import { Stack, useNavigationContainerRef, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import {
  ThemeProvider as AppThemeProvider,
  navFromTheme,
  useTheme as useAppTheme,
} from "../theme/theme";

import { ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import CreatePostModal from "../components/common/createPostModal";
import { ToastProvider } from "../components/common/Toast";
import { useAuthStore } from "../store/useAuthStore";
import { useUiStore } from "../store/useUiStore";

export default function RootLayout() {
  return (
    <AppThemeProvider forceScheme="light">
      <NavLinker />
    </AppThemeProvider>
  );
}

function NavLinker() {
  const t = useAppTheme();
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();

  const modalVisible = useUiStore((s) => s.createPostModal.visible);
  const modalInitialForm = useUiStore((s) => s.createPostModal.initialForm);
  const closeCreatePostModal = useUiStore((s) => s.closeCreatePostModal);

  const { _hasHydrated, token, expiresAt } = useAuthStore();

  // Primary auth redirect — waits for both store hydration AND navigator ready
  useEffect(() => {
    if (!_hasHydrated) return;

    const redirect = () => {
      const isExpired = expiresAt
        ? new Date(expiresAt).getTime() <= Date.now()
        : false;

      const loggedIn = !!token && !isExpired;
      router.replace(loggedIn ? "/(tabs)/home" : "/(auth)/login");
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
  }, [_hasHydrated]);

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

      if (authState.expiresAt) {
        const expiry = new Date(authState.expiresAt).getTime();
        const now = Date.now();
        const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiry <= 0) {
          authState.signOut();
          return;
        }

        // Token is fresh enough — skip server verification
        if (daysUntilExpiry > 7) return;
      }

      // Only hits server if token expires within 7 days or has no expiry info
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

  return (
    <NavigationThemeProvider value={navFromTheme(t)}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <ToastProvider>
          <StatusBar style={t.isDark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: t.colors.background },
            }}
          >
            {/* Auth flow */}
            <Stack.Screen name="(auth)" />
            {/* Main app tabs */}
            <Stack.Screen name="(tabs)" />
            {/* Shared screens accessible from any tab */}
            <Stack.Screen name="(shared)" />
          </Stack>
          {/* Globally mounted CreatePostModal to avoid tab-induced re-renders */}
          <CreatePostModal
            visible={modalVisible}
            initialForm={modalInitialForm}
            onClose={closeCreatePostModal}
          />
          </ToastProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFBF8",
  },
});
