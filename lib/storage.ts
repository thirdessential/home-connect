import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import type { StateStorage } from 'zustand/middleware';

const SERVICE = 'homeconnect.auth';
const LEGACY_KEY = 'userToken';

export async function getToken(): Promise<string | null> {
    // 1) Try Keychain (best)
    try {
        const creds = await Keychain.getGenericPassword({ service: SERVICE });
        if (creds) return creds.password;
    } catch { }

    // 2) Migrate from SecureStore (if present)
    try {
        if (Platform.OS !== 'web') {
            const ss = await SecureStore.getItemAsync(LEGACY_KEY);
            if (ss) {
                try {
                    await Keychain.setGenericPassword('token', ss, {
                        service: SERVICE,
                        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
                    });
                    await SecureStore.deleteItemAsync(LEGACY_KEY);
                } catch { }
                return ss;
            }
        } else {
            if (typeof window === 'undefined') return null;
            // Browser web session: read from localStorage-backed persist adapter.
            return window.localStorage.getItem(LEGACY_KEY);
        }
    } catch { }

    // 3) Migrate from AsyncStorage (last resort)
    try {
        const as = await AsyncStorage.getItem(LEGACY_KEY);
        if (as) {
            try {
                await Keychain.setGenericPassword('token', as, {
                    service: SERVICE,
                    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
                });
                await AsyncStorage.removeItem(LEGACY_KEY);
            } catch { }
            return as;
        }
    } catch { }

    return null;
}

export async function setToken(value: string): Promise<void> {
    // Prefer Keychain
    try {
        await Keychain.setGenericPassword('token', value, {
            service: SERVICE,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        });
        return;
    } catch { }
    // Fallbacks (don’t crash if native module is unavailable)
    try { if (Platform.OS !== 'web') await SecureStore.setItemAsync(LEGACY_KEY, value); } catch { }
    try { await AsyncStorage.setItem(LEGACY_KEY, value); } catch { }
}

export async function deleteToken(): Promise<void> {
    try { await Keychain.resetGenericPassword({ service: SERVICE }); } catch { }
    try { if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(LEGACY_KEY); } catch { }
    try { await AsyncStorage.removeItem(LEGACY_KEY); } catch { }
}

/**
 * Cross-platform storage adapter for Zustand persist.
 *
 * Why:
 * - On web server render (Node), AsyncStorage can throw (`window is not defined`).
 * - We use `localStorage` on browser client and a no-op storage on SSR.
 */
export const zustandStorage: StateStorage = {
    getItem: async (name) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return null;
            return window.localStorage.getItem(name);
        }
        return AsyncStorage.getItem(name);
    },
    setItem: async (name, value) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return;
            window.localStorage.setItem(name, value);
            return;
        }
        await AsyncStorage.setItem(name, value);
    },
    removeItem: async (name) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return;
            window.localStorage.removeItem(name);
            return;
        }
        await AsyncStorage.removeItem(name);
    },
};