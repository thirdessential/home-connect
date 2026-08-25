import { API_BASE, Post, PostPublic } from "@/lib/httpMethods";
import { secureStorage } from "@/lib/storage";
import { registerAuthStore } from "@/lib/tokenManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AuthStore, User } from "./auth.type";
import { useAdminStore } from "./useAdminStore";
import { useBusinessRegistrationStore } from "./useBusinessRegistrationStore";
import { useProductStore } from "./useBusinessStore";
import { useDailyHelperStore } from "./useDailyHelper";
import { useEventStore } from "./useEventStore";
import { useFeedsStore } from "./useFeedsStore";
import { useSocietyStore } from "./useSocietyStore";
import { useUserStore } from "./useUserStore";
import { useWholesaleDealStore } from "./useWholesaleDealStore";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      roles: ["guest"],
      expiresAt: null,
      _hasHydrated: false,
      isSendingOtp: false,
      isVerifyingOtp: false,

      setToken: (token) => set({ token }),
      setExpiresAt: (expiresAt: string | null) => set({ expiresAt }),
      setRoles: (roles) => set({ roles: Array.isArray(roles) && roles.length > 0 ? roles : ["guest"] }),
      signOut: () => {
        set({ token: null, roles: ["guest"], expiresAt: null });
        useUserStore.getState().clear();
        useSocietyStore.getState().clear();
        useFeedsStore.getState().clear();
        useProductStore.getState().clear();
        useDailyHelperStore.getState().clear();
        useWholesaleDealStore.getState().clear();
        useAdminStore.getState().clear();
        useBusinessRegistrationStore.getState().clear();
        useEventStore.getState().clear();
        // Nulling the token above already overwrites the persisted secret, but
        // drop the SecureStore entry outright so no stale session blob is left.
        void useAuthStore.persist?.clearStorage?.();
      },
      clearAllStoreData: () => {
        // Clears all society-scoped data without touching auth or society list.
        // Call this before switching to a different society while logged in.
        useFeedsStore.getState().clear();
        useProductStore.getState().clear();
        useDailyHelperStore.getState().clear();
        useWholesaleDealStore.getState().clear();
        useAdminStore.getState().clear();
        useEventStore.getState().clear();
      },
      _setHasHydrated: (v) => set({ _hasHydrated: v }),

      sendOtp: async (phone: string) => {
        set({ isSendingOtp: true });
        try {
          await PostPublic<{ success: boolean; status: string }>("/api/auth/send-otp", { phone });
        } catch (err) {
          console.error("Send OTP failed:", err);
          throw err;
        } finally {
          set({ isSendingOtp: false });
        }
      },

      verifyOtp: async (phone: string, code: string) => {
        set({ isVerifyingOtp: true });
        try {
          const res = await PostPublic<{ user: User; token: string; expiresAt?: string }>("/api/auth/verify-otp", { phone, code });
          const userRoles = res?.user?.roles?.length ? res.user.roles : ["guest"];
          set({
            token: res.token,
            roles: userRoles,
            expiresAt: res?.expiresAt || null,
          });
          useUserStore.getState().setUser(res.user); // set user in user store
        } catch (err) {
          console.error("Verify OTP failed:", err);
          throw err;
        } finally {
          set({ isVerifyingOtp: false });
        }
      },

      // Verify token + proactive refresh (call after hydration)
      initSession: async () => {
        const { expiresAt } = get();

        // Check if token is obviously expired before making network call
        if (expiresAt) {
          const expiry = new Date(expiresAt).getTime();
          const now = Date.now();
          if (now > expiry) {
            console.log("Token is expired based on local time, signing out");
            get().signOut();
            return;
          }
        }

        try {
          const verification = await verifyCurrentToken();
          if (verification?.user) {
            useUserStore.getState().setUser(verification.user);
          }
          if (verification?.tokenExpiry) {
            set({ expiresAt: verification.tokenExpiry });
          }

          // Check if refresh needed
          if (shouldRefresh(get().expiresAt, 5)) {
            await get().refreshToken();
          } else {
          }
        } catch (err) {
          console.warn("Token verify failed during initSession", err);

          // Check if this is a network error (common on Android with local dev server)
          const errorMessage = err instanceof Error ? err.message : String(err);
          // Only attempt sign-out if the error indicates token is truly invalid/expired from server
          if (errorMessage.includes("Invalid") || errorMessage.includes("expired") || errorMessage.includes("401")) {
            // Try to silently refresh first — the access token may have expired but
            // the refresh cookie could still be valid (common on Android after background kill)
            try {
              await get().refreshToken();
              // If refresh gave us a new token, we're good — stay logged in
              if (!get().token) {
                console.log("Refresh returned no token, signing out");
                get().signOut();
              }
            } catch {
              console.log("Refresh also failed, signing out");
              get().signOut();
            }
          }
          // Network / timeout errors: silently ignore, keep the user logged in
        }
      }, refreshToken: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await Post<{ token: string; expiresAt: string; user?: User }>("/api/auth/refresh-token", {});
          set({ token: res.token, expiresAt: res.expiresAt });
          if (res?.user) useUserStore.getState().setUser(res.user);
        } catch (err) {
          console.warn("Refresh token failed", err);
        }
      },

      refreshIfNeeded: async () => {
        if (shouldRefresh(get().expiresAt, 1)) {
          await get().refreshToken();
        }
      },
    }),
    {
      name: "auth-store",
      // Store auth data in expo-secure-store (Keychain/Keystore) instead of
      // plaintext AsyncStorage so tokens are protected at rest on-device.
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        token: state.token,
        roles: state.roles,
        expiresAt: state.expiresAt,
      }),
      onRehydrateStorage: () => async (state, err) => {
        if (err) {
          console.error("Auth rehydrate error", err);
          return;
        }

        // One-time migration: move token from old plaintext AsyncStorage → SecureStore.
        // If SecureStore already has a token this block is a no-op.
        if (!state?.token) {
          try {
            const raw = await AsyncStorage.getItem("auth-store");
            if (raw) {
              const parsed = JSON.parse(raw);
              const old = parsed?.state;
              if (old?.token) {
                useAuthStore.setState({
                  token: old.token,
                  roles: Array.isArray(old.roles) && old.roles.length ? old.roles : ["guest"],
                  expiresAt: old.expiresAt ?? null,
                });
              }
              // Remove old plaintext entry regardless of whether we found a token
              await AsyncStorage.removeItem("auth-store");
            }
          } catch (e) {
            console.warn("Auth migration from AsyncStorage failed", e);
          }
        }

        state?._setHasHydrated(true);
        // initSession is called from _layout.tsx with proper expiry guards.
        // Do NOT call it here — on Android every cold start triggers onRehydrateStorage,
        // and calling initSession unconditionally causes spurious sign-outs when the
        // server rejects a still-valid token or is temporarily unreachable.
      },
      version: 2,
      migrate: (persistedState, version) => Promise.resolve(persistedState),
    }
  )
);

// Helper
export const isLoggedIn = () => {
  const { token, roles } = useAuthStore.getState();
  const userRoles = roles && Array.isArray(roles) ? roles : ["guest"];
  return !!token && !userRoles.includes("guest");
};

// Debug helper for Android session issues
export const debugAuthStorage = async () => {
  try {
    const stored = await AsyncStorage.getItem("auth-store");
    console.log("Raw auth storage:", stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("Parsed auth storage:", parsed);
    }

    const currentState = useAuthStore.getState();
    console.log("Current auth state:", {
      hasToken: !!currentState.token,
      roles: currentState.roles,
      expiresAt: currentState.expiresAt,
      hasHydrated: currentState._hasHydrated
    });
  } catch (e) {
    console.error("Debug storage error:", e);
  }
};

// Environment-aware connectivity check
export const checkServerConnectivity = async () => {
  try {
    console.log("Checking server connectivity...");
    console.log(API_BASE , "Checking server connectivity...");
    const response = await fetch(`${API_BASE}/api/auth/verify-token`, {
      method: "HEAD",
      // In development, add timeout to fail faster if local server is down
      signal: __DEV__ ? AbortSignal.timeout(3000) : undefined,
    });
    console.log("Server connectivity check:", {
      ok: response.ok,
      status: response.status,
      environment: __DEV__ ? 'development' : 'production'
    });
    return response.ok;
  } catch (error) {
    console.warn("Server not reachable:", error instanceof Error ? error.message : error);
    return false;
  }
};// ---- internal helpers ----
function shouldRefresh(expiresAt: string | null, thresholdDays: number) {
  if (!expiresAt) return false;
  const expMs = new Date(expiresAt).getTime();
  const now = Date.now();
  const diffDays = (expMs - now) / (1000 * 60 * 60 * 24);
  return diffDays < thresholdDays;
}

async function verifyCurrentToken() {
  const { token } = useAuthStore.getState();
  if (!token) throw new Error("No token");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const r = await fetch(`${API_BASE}/api/auth/verify-token`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const json = await r.json();

    if (!r.ok || !json?.isValid) {
      const errorMsg = json?.error || `HTTP ${r.status}`;
      console.warn("Token verification failed:", errorMsg);
      throw new Error(errorMsg);
    }

    return json;
  } catch (error) {
    // Re-throw with more context for better error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof TypeError || errorMessage.includes("fetch") || errorMessage.includes("AbortError")) {
      throw new Error(`Network request failed: ${errorMessage}`);
    }
    throw error;
  }
}

// Register this store with token manager after creation
const authStore = useAuthStore;
registerAuthStore(authStore);