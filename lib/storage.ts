import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/**
 * Cross-platform storage adapter for Zustand persist (NON-SENSITIVE state).
 *
 * Why:
 * - On web server render (Node), AsyncStorage can throw (`window is not defined`).
 * - We use `localStorage` on browser client and a no-op storage on SSR.
 *
 * Do NOT use this for auth tokens — use `secureStorage` below.
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

/**
 * Encrypted storage adapter for Zustand persist (SENSITIVE state — auth tokens).
 *
 * Native: expo-secure-store (iOS Keychain / Android Keystore) so the JWT is
 * encrypted at rest and unreadable by other apps or by an adb backup.
 * Web: localStorage (no OS keystore exists in the browser).
 *
 * SecureStore caps a single value at 2048 bytes. The persisted auth slice is
 * only { token, roles, expiresAt }, which is well under that, but the write is
 * guarded so an oversized JWT degrades loudly instead of silently losing the
 * session.
 */
export const secureStorage: StateStorage = {
    getItem: async (name) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return null;
            return window.localStorage.getItem(name);
        }
        try {
            return await SecureStore.getItemAsync(name);
        } catch (e) {
            console.warn('[secureStorage] read failed', e);
            return null;
        }
    },
    setItem: async (name, value) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return;
            window.localStorage.setItem(name, value);
            return;
        }
        try {
            await SecureStore.setItemAsync(name, value);
        } catch (e) {
            console.warn('[secureStorage] write failed — session will not persist', e);
        }
    },
    removeItem: async (name) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return;
            window.localStorage.removeItem(name);
            return;
        }
        try {
            await SecureStore.deleteItemAsync(name);
        } catch (e) {
            console.warn('[secureStorage] delete failed', e);
        }
    },
};
