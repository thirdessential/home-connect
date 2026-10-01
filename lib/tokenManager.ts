/**
 * Token Manager - bridge between the HTTP layer and the auth store.
 * Imported by httpMethods.ts so it never imports useAuthStore directly
 * (that would be a circular dependency).
 */

export type RefreshOutcome = "ok" | "invalid" | "network";

let authStore: any = null;

/**
 * Register the auth store instance
 * Called by useAuthStore after it's initialized
 */
export function registerAuthStore(store: any) {
    authStore = store;
}

/**
 * Get the current auth token
 */
export function getToken(): string | null {
    if (!authStore) {
        return null;
    }
    try {
        return authStore.getState().token || null;
    } catch {
        return null;
    }
}

/**
 * Resolves once persisted auth state has been restored, so no authenticated
 * request is sent (and rejected) before the stored token is available.
 */
export function waitForAuthReady(): Promise<void> {
    if (!authStore) return Promise.resolve();
    if (authStore.getState()._hasHydrated) return Promise.resolve();
    return new Promise((resolve) => {
        const unsub = authStore.subscribe((s: any) => {
            if (s._hasHydrated) {
                unsub();
                resolve();
            }
        });
        // Never block requests forever if hydration somehow never reports.
        setTimeout(() => { unsub(); resolve(); }, 4000);
    });
}

/** Refresh the access token (and rotate the refresh token if due) before it expires. */
export async function ensureFreshAccessToken(): Promise<void> {
    try {
        await authStore?.getState().ensureFreshToken();
    } catch {
        /* a failed proactive refresh must never block the request itself */
    }
}

/** Single-flight refresh used after a 401. */
export async function refreshAccessToken(): Promise<RefreshOutcome> {
    if (!authStore) return "invalid";
    try {
        return await authStore.getState().refreshSession();
    } catch {
        return "network";
    }
}

/** The server says the session can't be recovered: log out with the expiry message. */
export function expireSession() {
    try {
        authStore?.getState().expireSession();
    } catch (err) {
        console.error("Failed to expire session:", err);
    }
}

/**
 * Sign out the user
 */
export async function signOutUser() {
    if (!authStore) {
        return;
    }
    try {
        authStore.getState().signOut();
    } catch (err) {
        console.error("Failed to sign out:", err);
    }
}
