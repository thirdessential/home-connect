import { create } from "zustand";

type ConfigWarningState = {
    message: string | null;
    setWarning: (message: string) => void;
    clearWarning: () => void;
};

// Ephemeral, unpersisted — surfaces startup config problems (e.g. an invalid
// EXPO_PUBLIC_MY_TERRACE_APP_BACKEND) to the UI via ConfigWarningBanner
// instead of only the Metro console, which most testers never see.
export const useConfigWarningStore = create<ConfigWarningState>((set) => ({
    message: null,
    setWarning: (message) => set({ message }),
    clearWarning: () => set({ message: null }),
}));
