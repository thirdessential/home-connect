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

// Restores the Society auth context (fresh login or session restore).
// `societyId` comes back as a populated Society object whenever the user has
// one selected (see user.service.js#getUserWithSociety) — regardless of
// resident/business verification approval. Gating this on "approved" was
// conflating OTP/session login with verification-approval status, so a Guest
// who only submitted a verification request never got their selected Society
// restored after OTP or app restart. Guest/role status is untouched here —
// only which Society is shown as selected.
function syncSelectedSociety(user?: User | null) {
  const society = user?.societyId;
  if (society && typeof society !== "string") {
    useSocietyStore.getState().setSelectedSociety(society, society.towers || []);
  }
}

// Shared across the module so concurrent 401s trigger exactly one refresh call.
let refreshInFlight: Promise<"ok" | "invalid" | "network"> | null = null;
let lastProactiveAttempt = 0;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      roles: ["guest"],
      expiresAt: null,
      refreshToken: null,
      refreshExpiresAt: null,
      sessionExpired: false,
      _hasHydrated: false,
      isSendingOtp: false,
      isVerifyingOtp: false,

      setToken: (token) => set({ token }),
      setExpiresAt: (expiresAt: string | null) => set({ expiresAt }),
      setRoles: (roles) => set({ roles: Array.isArray(roles) && roles.length > 0 ? roles : ["guest"] }),
      signOut: () => {
        // Revoke this session's refresh-token family server-side (best effort,
        // never blocks or throws — local sign-out must always succeed).
        const rt = get().refreshToken;
        if (rt) {
          void fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: rt }),
          }).catch(() => {});
        }
        set({ token: null, roles: ["guest"], expiresAt: null, refreshToken: null, refreshExpiresAt: null });
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

      expireSession: () => {
        if (!get().token && !get().refreshToken) return; // already logged out
        set({ sessionExpired: true });
        get().signOut();
      },
      clearSessionExpired: () => set({ sessionExpired: false }),

      refreshSession: () => {
        if (refreshInFlight) return refreshInFlight;
        refreshInFlight = (async (): Promise<"ok" | "invalid" | "network"> => {
          const { token, refreshToken } = get();
          // Nothing to refresh with: only the legacy bearer-migration path remains.
          if (!refreshToken && !token) return "invalid";
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          try {
            const r = await fetch(`${API_BASE}/api/auth/refresh-token`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(!refreshToken && token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(refreshToken ? { refreshToken } : {}),
              signal: controller.signal,
            });
            let json: any = {};
            try { json = await r.json(); } catch { /* non-JSON */ }
            if (r.ok && json?.token) {
              set({
                token: json.token,
                expiresAt: json.expiresAt ?? null,
                // Present only when the server rotated it (final 5 days / legacy migration).
                ...(json.refreshToken ? { refreshToken: json.refreshToken } : {}),
                refreshExpiresAt: json.refreshExpiresAt ?? get().refreshExpiresAt,
              });
              if (json.user) {
                useUserStore.getState().setUser(json.user);
                if (json.user.roles?.length) set({ roles: json.user.roles });
              }
              return "ok";
            }
            // Definitive rejection of the refresh credential => end the session.
            if (r.status === 401 || r.status === 403) {
              get().expireSession();
              return "invalid";
            }
            return "network"; // 5xx etc.: temporary, keep the session
          } catch {
            return "network"; // offline / timeout: never log out for this
          } finally {
            clearTimeout(timeoutId);
            refreshInFlight = null;
          }
        })();
        return refreshInFlight;
      },

      ensureFreshToken: async () => {
        const { token, refreshToken, expiresAt, refreshExpiresAt } = get();
        if (!token) return;
        const now = Date.now();
        const accessLeft = expiresAt ? new Date(expiresAt).getTime() - now : Infinity;
        const refreshLeftDays = refreshExpiresAt
          ? (new Date(refreshExpiresAt).getTime() - now) / 86400000
          : Infinity;
        const accessDue = accessLeft < 2 * 60 * 1000;
        const windowDue = !!refreshToken && refreshLeftDays <= 5;
        const legacy = !refreshToken; // pre-refresh-token session: migrate once
        if (!accessDue && !windowDue && !legacy) return;
        // Failed proactive attempts back off (offline resume shouldn't spam).
        if (!accessDue && now - lastProactiveAttempt < 10 * 60 * 1000) return;
        lastProactiveAttempt = now;
        await get().refreshSession();
      },

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
          const res = await PostPublic<{ user: User; token: string; expiresAt?: string; refreshToken?: string; refreshExpiresAt?: string }>("/api/auth/verify-otp", { phone, code });
          const userRoles = res?.user?.roles?.length ? res.user.roles : ["guest"];
          set({
            token: res.token,
            roles: userRoles,
            expiresAt: res?.expiresAt || null,
            refreshToken: res?.refreshToken ?? null,
            refreshExpiresAt: res?.refreshExpiresAt ?? null,
            sessionExpired: false,
          });
          useUserStore.getState().setUser(res.user); // set user in user store
          syncSelectedSociety(res.user);
        } catch (err) {
          console.error("Verify OTP failed:", err);
          throw err;
        } finally {
          set({ isVerifyingOtp: false });
        }
      },

      // Validate + sync the stored session (call after hydration). Recovers an
      // expired access token via the refresh token instead of signing out.
      initSession: async () => {
        if (!get().token) return;
        await get().ensureFreshToken();
        if (!get().token) return; // refresh said the session is gone

        try {
          const verification = await verifyCurrentToken();
          if (verification?.user) {
            useUserStore.getState().setUser(verification.user);
            syncSelectedSociety(verification.user);
            if (verification.user.roles?.length) {
              set({ roles: verification.user.roles });
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (/expired|invalid|401/i.test(msg) && !/network/i.test(msg)) {
            // Access token rejected: one refresh attempt; "invalid" logs out inside.
            await get().refreshSession();
          }
          // Network / timeout errors: keep the user logged in.
        }
      },

      refreshIfNeeded: async () => {
        await get().ensureFreshToken();
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
        refreshToken: state.refreshToken,
        refreshExpiresAt: state.refreshExpiresAt,
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