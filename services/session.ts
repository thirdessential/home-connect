// services/session.ts
// Token is stored in expo-secure-store (Keychain/Keystore) so it is encrypted
// at rest and inaccessible to other apps. Non-sensitive user metadata is kept
// in AsyncStorage. This avoids duplicate token storage alongside useAuthStore.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "hc.session.token";
const USER_KEY = "hc.session.user";

export const saveSession = async (token: string, user: any) => {
    if (Platform.OS !== "web") {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = async (): Promise<string | null> => {
    try {
        if (Platform.OS !== "web") return SecureStore.getItemAsync(TOKEN_KEY);
        return AsyncStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
};

export const getUser = async <T = any>(): Promise<T | null> => {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
};

export const clearSession = async (): Promise<void> => {
    if (Platform.OS !== "web") {
        try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch { }
    } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
    }
    await AsyncStorage.removeItem(USER_KEY);
};
