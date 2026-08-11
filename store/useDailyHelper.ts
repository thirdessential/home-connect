import { Get, Post } from "@/lib/httpMethods";
import { DailyHelper, DailyHelperStore, ReportItem } from "@/types/business.type";
import { Review } from "@/types/common.type";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { zustandStorage } from "@/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useDailyHelperStore = create<DailyHelperStore>()(
    persist(
        (set, get) => ({
            dailyHelper: null,
            dailyHelperList: null,
            pendingReq: 0,
            totalCount: 0,
            approvedReq: 0,
            loading: false,
            error: null,
            _hasHydrated: false,

            setDailyHelper: (service) => set({ dailyHelper: service }),
            createDailyHelper: async (service: Partial<DailyHelper>) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{ code: number; dailyServices: DailyHelper }>(`/api/daily-service/create`, service);
                    if (!response) {
                        throw new Error("No response received from server");
                    }
                    if (response.code === 201) {
                        set({ dailyHelper: response.dailyServices, loading: false });
                    } else {
                        set({ error: "Failed to create product", loading: false });
                        throw new Error("Failed to create product");
                    }
                } catch (error: any) {
                    set({ error: error?.message || "Failed to create product", loading: false });
                    alert(error?.message || "Failed to create product");
                }
            },
            getAllApprovedDailyServices: async (societyId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{ success: boolean; code: number; dailyServices: DailyHelper[], pendingReq: number, totalCount: number, approvedReq: number }>(`/api/daily-service/approved/${societyId}`);
                    if (response?.success && Array.isArray(response.dailyServices)) {
                        set({ dailyHelperList: response.dailyServices, pendingReq: response.pendingReq, totalCount: response.totalCount, loading: false });
                    } else {
                        set({ error: "Failed to fetch product", loading: false });
                    }
                } catch (err: any) {
                    set({ error: err?.message || "Failed to fetch product", loading: false });
                }
            },
            getAllDailyServicesBySocietyId: async (societyId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{ success: boolean; code: number; dailyServices: DailyHelper[]; pendingReq: number, totalCount: number, approvedReq: number }>(`/api/daily-service/all/${societyId}`);
                    if (response?.success && Array.isArray(response.dailyServices)) {
                        set({ dailyHelperList: response.dailyServices, pendingReq: response.pendingReq, totalCount: response.totalCount, approvedReq: response.approvedReq, loading: false });
                    } else {
                        set({ error: "Failed to fetch product", loading: false });
                    }
                } catch (err: any) {
                    set({ error: err?.message || "Failed to fetch product", loading: false });
                }
            },
            getHelperById: async (helperId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{ success: boolean; code: number; helper: DailyHelper }>(`/api/daily-service/${helperId}`);
                    if (response?.success && response.helper) {
                        set({ dailyHelper: response.helper, loading: false });
                    } else {
                        set({ error: "Failed to fetch product", loading: false });
                    }
                } catch (err: any) {
                    set({ error: err?.message || "Failed to fetch product", loading: false });
                }
            },
            updateDailyService: async (product: Partial<DailyHelper>, productId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{ code: number; product: DailyHelper }>(`/api/daily-service/update/${productId}`, product);
                    if (!response) {
                        throw new Error("No response received from server");
                    }
                    if (response.code === 200) {
                        set({ dailyHelper: response.product, loading: false });
                    } else {
                        set({ error: "Failed to update product", loading: false });
                        throw new Error("Failed to update product");
                    }
                } catch (error: any) {
                    set({ error: error?.message || "Failed to update product", loading: false });
                    alert(error?.message || "Failed to update product");
                }
            },
            addDailyServiceReview: async (helperId: string, review: Review) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{
                        success: boolean;
                        message: string;
                        review: any;
                        avgRating: number;
                        totalReviews: number;
                    }>(`/api/daily-service/${helperId}/review`, review);
                    if (response?.success) {
                        // Update the local dailyHelper if it matches
                        set((state) => {
                            let updatedHelper = state.dailyHelper;
                            if (updatedHelper && updatedHelper._id === helperId) {
                                const updatedReviews = [...(updatedHelper.reviews || []), response.review];
                                updatedHelper = {
                                    ...updatedHelper,
                                    reviews: updatedReviews,
                                    averageRating: response.avgRating,
                                };
                            }
                            // Also update in dailyHelperList if present
                            let updatedList = state.dailyHelperList;
                            if (updatedList) {
                                updatedList = updatedList.map((h) =>
                                    h._id === helperId
                                        ? {
                                            ...h,
                                            reviews: [...(h.reviews || []), response.review],
                                            averageRating: response.avgRating,
                                        }
                                        : h
                                );
                            }
                            return {
                                dailyHelper: updatedHelper,
                                dailyHelperList: updatedList,
                                loading: false,
                                error: null,
                            };
                        });
                    } else {
                        set({ error: response?.message || "Failed to add review", loading: false });
                    }
                } catch (error: any) {
                    set({ error: error?.message || "Failed to add review", loading: false });
                }
            },
            reportService: async (helperId: string, userId: string, reason: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{
                        success: boolean;
                        code: number;
                        message: string;
                        totalReportCount: number;
                        reports: ReportItem[];
                    }>(
                        `/api/daily-service/report/${helperId}`,
                        { userId, reason }
                    );

                    if (response?.success && response?.code === 200) {
                        // Update the helper with the new report count and reports
                        set((state) => ({
                            dailyHelper: state.dailyHelper?._id === helperId
                                ? {
                                    ...state.dailyHelper,
                                    report: response.reports,
                                    totalReportCount: response.totalReportCount
                                }
                                : state.dailyHelper,
                            dailyHelperList: state.dailyHelperList
                                ? state.dailyHelperList.map((h) =>
                                    h._id === helperId
                                        ? {
                                            ...h,
                                            report: response.reports,
                                            totalReportCount: response.totalReportCount
                                        }
                                        : h
                                )
                                : state.dailyHelperList,
                            loading: false,
                        }));
                    } else {
                        const errorMsg = response?.message || "Failed to report daily helper";
                        set({ error: errorMsg, loading: false });
                        throw new Error(errorMsg);
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : "Failed to report daily helper";
                    set({ error: errorMsg, loading: false });
                    throw error;
                }
            },
            clear: () => set({ dailyHelper: null }),
            _setHasHydrated: (v) => set({ _hasHydrated: v }),
        }),
        {
            name: "daily-helper-store",
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({ dailyHelper: state.dailyHelper }),
            onRehydrateStorage: () => (state, err) => {
                state?._setHasHydrated(true);
                if (err) console.warn("DailyHelper rehydrate error", err);
            },
        }
    )
);