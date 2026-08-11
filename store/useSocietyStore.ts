import { Get, Post } from "@/lib/httpMethods";
import { Society, SocietyStore, Tower } from "@/types/society.type";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { zustandStorage } from "@/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Helper function to extract societies from various response formats
const extractSocieties = (response: any): Society[] => {
    if (Array.isArray(response)) return response;
    if (response?.societies && Array.isArray(response.societies)) return response.societies;
    return [];
};

// Helper function to handle API errors
const getErrorMessage = (error: any): string => {
    return error?.message || error?.data?.message || "Operation failed";
};

export const useSocietyStore = create<SocietyStore>()(
    persist(
        (set, get) => ({
            societies: [],
            selectedSociety: null,
            members: [],
            towerList: [],
            loading: false,
            error: null,
            errorStep: null,
            totalResidents: 0,
            _hasHydrated: false,

            // Setter methods
            setSocieties: (societies) => set({ societies }),
            setSelectedSociety: (society, towerList) => {
                set({
                    selectedSociety: society,
                    towerList: Array.isArray(society?.towers) ? society.towers : (towerList || []),
                });
            },
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),
            _setHasHydrated: (v) => set({ _hasHydrated: v }),

            // Fetch all societies. Gated server-side on OTP verification + a
            // saved location — a 403 with a `step` field tells the UI which
            // onboarding screen to send the user back to.
            getAllSociety: async () => {
                set({ loading: true, error: null, errorStep: null });
                try {
                    const response = await Get("/api/society/list");
                    const societies = extractSocieties(response);

                    if (societies.length > 0) {
                        set({ societies, loading: false });
                    } else {
                        set({ error: "No societies found", loading: false });
                    }
                } catch (error: any) {
                    set({
                        error: getErrorMessage(error),
                        errorStep: error?.body?.step ?? null,
                        loading: false,
                    });
                }
            },

            // Refresh societies (clear cache first, then fetch)
            refreshSocieties: async () => {
                set({ societies: [], loading: true, error: null, errorStep: null });
                try {
                    const response = await Get("/api/society/list");
                    const societies = extractSocieties(response);

                    if (societies.length > 0) {
                        set({ societies, loading: false });
                    } else {
                        set({ error: "No societies found", loading: false });
                    }
                } catch (error: any) {
                    set({
                        error: getErrorMessage(error),
                        errorStep: error?.body?.step ?? null,
                        loading: false,
                    });
                }
            },

            // Select a society server-side (persists `selected_society_id` on
            // the user), then mirror it into local state.
            selectSociety: async (societyId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{ success: boolean; society: Society }>(
                        "/api/society/select",
                        { society_id: societyId },
                    );
                    if (response?.success && response.society) {
                        set({
                            selectedSociety: response.society,
                            towerList: Array.isArray(response.society.towers)
                                ? response.society.towers
                                : [],
                            loading: false,
                        });
                        return response.society;
                    }
                    set({ error: "Failed to select society", loading: false });
                    return null;
                } catch (error: any) {
                    set({ error: getErrorMessage(error), loading: false });
                    throw error;
                }
            },

            // Submit society/resident verification. Always lands as `pending`
            // server-side — admin approval is what grants the resident role.
            submitVerification: async (payload) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{ success: boolean; user: any }>(
                        "/api/society/verify",
                        payload,
                    );
                    set({ loading: false });
                    if (response?.success) return response.user;
                    return null;
                } catch (error: any) {
                    set({ error: getErrorMessage(error), loading: false });
                    throw error;
                }
            },

            // Get total residents count
            getTotalResidents: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{ totalResidents: number }>("/api/society/total-residents/count");
                    const totalResidents = response?.totalResidents;

                    if (totalResidents !== undefined) {
                        set({ totalResidents, loading: false });
                    } else {
                        throw new Error("Invalid response format");
                    }
                } catch (error: any) {
                    set({ error: getErrorMessage(error), loading: false });
                }
            },

            // Find tower by ID
            getTowerById: (towerId: string, towerList: Tower[]) => {
                return towerList.find((tower) => tower._id === towerId) || null;
            },

            // Clear all society data
            clear: () =>
                set({
                    societies: [],
                    selectedSociety: null,
                    towerList: [],
                    loading: false,
                    error: null,
                    errorStep: null,
                }),

            // Clear societies cache
            clearSocietiesCache: () => {
                set({ societies: [], error: null });
            },
        }),
        {
            name: "society-store",
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                selectedSociety: state.selectedSociety,
                towerList: state.towerList,
                // societies is intentionally not persisted - always fetch fresh from API
            }),
            onRehydrateStorage: () => (state, err) => {
                state?._setHasHydrated(true);
                if (err) console.warn("Society store hydration error:", err);
            },
        }
    )
);