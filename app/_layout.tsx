import { useFonts } from "expo-font";
import { Stack, useNavigationContainerRef, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, StyleSheet, Text, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
import { ToastProvider } from "../components/common/Toast";
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
          <ImageUploadProvider>
          {/* hidden explicitly false: this SDK's expo-status-bar has no
              backgroundColor/translucent props (edge-to-edge is controlled
              natively), so the only supported lever against "status bar not
              visible" is guaranteeing it's never toggled hidden. */}
          <StatusBar style={Platform.OS === "ios" ? "dark" : "auto"} hidden={false} />
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
          {/* Globally mounted CreatePostModal to avoid tab-induced re-renders */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
