/**
 * Token Manager - Manages auth token without circular dependencies
 * This module is imported by httpMethods.ts to avoid circular dependency with useAuthStore
 */

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
