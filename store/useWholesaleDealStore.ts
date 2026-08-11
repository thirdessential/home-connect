import { verificationStatus } from "@/assets/enums/common.enum";
import { Delete, Get, Patch, Post } from "@/lib/httpMethods";
import { zustandStorage } from "@/lib/storage";
import {
  OrderData,
  ReportItem,
  WholesaleDeal,
  WholesaleDealStore,
} from "@/types/business.type";
import { Alert } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useWholesaleDealStore = create<WholesaleDealStore>()(
  persist(
    (set, get) => ({
      loading: false,
      error: null,
      success: false,
      deals: null,
      activeDeals: null,
      pendingReq: 0,
      activeDealsCount: 0,
      totalCount: 0,
      selectedDeal: null,
      usersDeal: null,
      lastFetchedAt: null as number | null,
      _hasHydrated: false,

      // Allow updating selectedDeal from anywhere without network calls
      setSelectedDeal: (deal) => set({ selectedDeal: deal }),
      updateSelectedDeal: (patch) => {
        const current = get().selectedDeal;
        if (!current) return; // nothing to update
        const updated = { ...current, ...patch } as WholesaleDeal;
        // Also reflect into deals list if the id matches
        const existingDeals = get().deals;
        const nextDeals = existingDeals
          ? existingDeals.map((d) =>
            d._id === updated._id ? { ...d, ...patch } : d,
          )
          : existingDeals;
        set({ selectedDeal: updated, deals: nextDeals });
      },
      createDeal: async (dealData: Partial<WholesaleDeal>) => {
        set({ loading: true, error: null, success: false });
        try {

          // console.log("dealData", dealData)

          const response = await Post<{
            code: number;
            deal: WholesaleDeal;
            success: boolean;
          }>("/api/wholesale-deal/create", dealData);
          if (response?.code === 201) {
            set({ selectedDeal: response.deal, loading: false });
          } else {
            set({ error: "Failed to create user", loading: false });
          }
        } catch (err: any) {
          console.log("CRD_error", err)
          set({
            loading: false,
            error: err?.response?.data?.message || "Failed to create deal",
          });
          Alert.alert(
            "Error",
            err?.response?.data?.message || "Failed to create deal",
          );
        }
      },
      getAllDealsBySocietyId: async (societyId: string, force = false) => {
        // Skip fetch if cache is fresh
        // console.log("societyId", societyId)
        // if (!force) {
        //   const { lastFetchedAt } = get();
        //   if (lastFetchedAt && Date.now() - lastFetchedAt < 15 * 60 * 1000) return;
        // }
        set({ loading: true, error: null });

        try {
          const dealResponse = await Get<{
            success: boolean;
            code: number;
            deals: WholesaleDeal[];
            pendingReq: number;
            activeDeals: number;
            totalCount: number;
          }>(`/api/wholesale-deal/getAllDeals/${societyId}`);
          // console.log("dealResponse", dealResponse);
          
          const activeDeals = (dealResponse.deals || []).filter(
            (d) =>
              (d as any)?.verificationStatus?.status ===
              verificationStatus.APPROVED &&
              ((d as any)?.dealStatus === "ACTIVE" ||
                (d as any)?.dealStatus === "UNLOCKING" ||
                (d as any)?.dealStatus === "UNLOCKED" ||
                (d as any)?.dealStatus === "FULL" ||
                (d as any)?.dealStatus === "CANCELLED" ||
                (d as any)?.dealStatus === "CLOSING_SOON" ||
                (d as any)?.dealStatus === "FAILED" ||
                (d as any)?.dealStatus === "COMING_SOON")
          );

          // console.log(
          //   "API DEALS =>",
          //   JSON.stringify(dealResponse.deals, null, 2)
          // );

          // console.log(
          //   "ACTIVE DEALS =>",
          //   JSON.stringify(activeDeals, null, 2)
          // );
          
          set({
            deals: dealResponse.deals,
            activeDeals,
          });

          // console.log("STORE UPDATED");
          // console.log("deals", dealResponse.deals?.length);
          // console.log("activeDeals", activeDeals?.length);

          set({
            deals: dealResponse.deals,
            activeDeals,
            loading: false,
            totalCount: dealResponse.totalCount,
            pendingReq: dealResponse.pendingReq,
            activeDealsCount: activeDeals.length,
            lastFetchedAt: Date.now()
          });
        } catch (err: any) {
          set({
            loading: false,
            error: err?.response?.data?.message || "Failed to fetch deals",
          });
        }
      },
      updateDeal: async (deal: Partial<WholesaleDeal>, dealId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await Patch<{
            code: number;
            deal: WholesaleDeal;
            success: boolean;
          }>(`/api/wholesale-deal/${dealId}`, deal);
          if (response?.code === 200) {
            const updatedDeal = response.deal;
            // Update deals list
            const currentDeals = get().deals;
            const updatedDeals = currentDeals
              ? currentDeals.map((d) =>
                d._id === dealId ? { ...d, ...updatedDeal } : d,
              )
              : null;
            // Update activeDeals list
            const currentActiveDeals = get().activeDeals;
            const updatedActiveDeals = currentActiveDeals
              ? currentActiveDeals.map((d) =>
                d._id === dealId ? { ...d, ...updatedDeal } : d,
              )
              : null;
            // Update usersDeal list
            const currentUserDeals = get().usersDeal;
            const updatedUserDeals = currentUserDeals
              ? currentUserDeals.map((d) =>
                d._id === dealId ? { ...d, ...updatedDeal } : d,
              )
              : null;
            set({
              selectedDeal: updatedDeal,
              deals: updatedDeals,
              activeDeals: updatedActiveDeals,
              usersDeal: updatedUserDeals,
              loading: false,
            });
          } else {
            set({ error: "Failed to update deal", loading: false });
          }
        } catch (err: any) {
          set({
            loading: false,
            error: err?.response?.data?.message || "Failed to update deal",
          });
        }
      },
      removeDeal: async (dealId: string) => {
        set({ loading: true, error: null });

        // Optimistically remove from UI immediately
        const currentDeals = get().deals;
        const currentActiveDeals = get().activeDeals;
        const currentUserDeals = get().usersDeal;

        const updatedDeals =
          currentDeals?.filter((deal) => deal._id !== dealId) || null;
        const updatedActiveDeals =
          currentActiveDeals?.filter((deal) => deal._id !== dealId) || null;
        const updatedUserDeals =
          currentUserDeals?.filter((deal) => deal._id !== dealId) || null;

        // Store previous state for rollback if API fails
        const previousState = {
          deals: currentDeals,
          activeDeals: currentActiveDeals,
          usersDeal: currentUserDeals,
        };

        // Update UI immediately (optimistic update)
        set({
          deals: updatedDeals,
          activeDeals: updatedActiveDeals,
          usersDeal: updatedUserDeals,
          loading: false,
        });

        try {
          const response = await Delete<{
            code: number;
            success: boolean;
            message: string;
          }>(`/api/wholesale-deal/${dealId}`);
          if (response?.code !== 200) {
            // Rollback on failure
            set({
              deals: previousState.deals,
              activeDeals: previousState.activeDeals,
              usersDeal: previousState.usersDeal,
              error: "Failed to remove deal",
              loading: false,
            });
          }
        } catch (err: any) {
          // Rollback on error
          set({
            deals: previousState.deals,
            activeDeals: previousState.activeDeals,
            usersDeal: previousState.usersDeal,
            loading: false,
            error: err?.response?.data?.message || "Failed to remove deal",
          });
        }
      },
      getDealById: async (dealId: string) => {
        set({ loading: true, error: null });
        
        // Check if this is a temporary deal (from optimistic creation)
        if (dealId.startsWith("temp-")) {
          const localDeal = get().deals?.find((d) => d._id === dealId);
          if (localDeal) {
            set({ selectedDeal: localDeal, loading: false });
            return;
          }
        }

        try {
          const response = await Get<{
            code: number;
            deal: WholesaleDeal;
            success: boolean;
          }>(`/api/wholesale-deal/getDeal/${dealId}`);
          if (response?.code === 200) {
            set({ selectedDeal: response.deal, loading: false });
          } else {
            set({ error: "Failed to fetch deal", loading: false });
          }
        } catch (err: any) {
          set({
            loading: false,
            error: err?.response?.data?.message || "Failed to fetch deal",
          });
        }
      },
      getDealsByUserId: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await Get<{
            success: boolean;
            code: number;
            deals: WholesaleDeal[];
          }>(`/api/wholesale-deal/getDealByUser/${userId}`);
          if (response?.code === 200) {
            set({ usersDeal: response.deals, loading: false });
          } else {
            set({ error: "Failed to fetch deals", loading: false });
          }
        } catch (err: any) {
          set({
            loading: false,
            error: err?.response?.data?.message || "Failed to fetch deals",
          });
        }
      },
      updateExpiredDeals: async (societyId: string) => {
        try {
          const response = await Get<{
            code: number;
            message: string;
            success: boolean;
          }>(`/api/wholesale-deal/updateExpired/${societyId}`);
          if (response?.code === 200) {
            set({ loading: false, success: true });
          } else {
            set({ loading: false, error: "Failed to update expired deals" });
          }
        } catch (err: any) {
          set({
            loading: false,
            error:
              err?.response?.data?.message || "Failed to update expired deals",
          });
        }
      },
      updateOrderStatus: async (
        dealId: string,
        orderId: string,
        status: "approved" | "rejected" | "pending" | "delivered" | "confirmed",
      ) => {
        const { selectedDeal, usersDeal } = get();

        // Snapshot for rollback
        const originalDeal =
          selectedDeal?._id === dealId
            ? selectedDeal
            : usersDeal?.find((d) => d._id === dealId);

        if (!originalDeal || !originalDeal.orders) {
          set({ error: "Deal or orders not found" });
          return;
        }

        // Optimistic UI update
        const updatedOrders = originalDeal.orders.map((order: any) =>
          order._id === orderId ? { ...order, status } : order,
        );
        const updatedDealPayload = { ...originalDeal, orders: updatedOrders };

        const patchAllSlices = (deal: WholesaleDeal) => {
          set((state) => ({
            selectedDeal: state.selectedDeal?._id === dealId ? deal : state.selectedDeal,
            usersDeal: state.usersDeal?.map((d) => (d._id === dealId ? deal : d)),
            deals: state.deals?.map((d) => (d._id === dealId ? deal : d)),
            activeDeals: state.activeDeals?.map((d) => (d._id === dealId ? deal : d)),
          }));
        };

        patchAllSlices(updatedDealPayload);

        try {
          const response = await Patch<{
            success: boolean;
            code: number;
            deal: WholesaleDeal;
          }>(`/api/orders/wholesale/${dealId}/orders/${orderId}/status`, { status });

          if (response?.success && response.deal) {
            // Sync store with authoritative server response (includes recalculated dealStatus)
            patchAllSlices(response.deal);
          }
        } catch (error) {
          console.error("Failed to update order status, rolling back...", error);
          patchAllSlices(originalDeal);
          set({ error: "Failed to update order status" });
        }
      },
      upsertWholesaleOrder: async (
        dealId: string,
        orderData: Partial<OrderData>,
      ) => {
        set({ loading: true, error: null });
        try {
          const response = await Post<{
            code: number;
            message: string;
            orderId: string;
            success: boolean;
          }>(`/api/orders/wholesale/${dealId}/upsert`, orderData);
          if (response?.code === 200) {
            // set({ selectedDeal: response.deal, loading: false, });
          } else {
            set({ error: "Failed to upsert order", loading: false });
          }
        } catch (err: any) {
          set({
            loading: false,
            error: err?.response?.data?.message || "Failed to upsert order",
          });
        }
      },
      // Add deal optimistically to activeDeals list for immediate UI feedback
      addDealOptimistically: (deal: WholesaleDeal) => {
        const currentActiveDeals = get().activeDeals || [];
        set({ activeDeals: [deal, ...currentActiveDeals] });
      },
      reportDeal: async (dealId: string, userId: string, reason: string) => {
        set({ loading: true, error: null });
        try {
          const response = await Post<{
            success: boolean;
            code: number;
            message: string;
            totalReportCount: number;
            reports: ReportItem[];
          }>(`/api/wholesale-deal/report/${dealId}`, { userId, reason });

          if (response?.success && response?.code === 200) {
            // Update the deal with the new report count and reports
            set((state) => ({
              selectedDeal:
                state.selectedDeal?._id === dealId
                  ? {
                    ...state.selectedDeal,
                    report: response.reports,
                    totalReportCount: response.totalReportCount,
                  }
                  : state.selectedDeal,
              deals: state.deals
                ? state.deals.map((d) =>
                  d._id === dealId
                    ? {
                      ...d,
                      report: response.reports,
                      totalReportCount: response.totalReportCount,
                    }
                    : d,
                )
                : state.deals,
              activeDeals: state.activeDeals
                ? state.activeDeals.map((d) =>
                  d._id === dealId
                    ? {
                      ...d,
                      report: response.reports,
                      totalReportCount: response.totalReportCount,
                    }
                    : d,
                )
                : state.activeDeals,
              usersDeal: state.usersDeal
                ? state.usersDeal.map((d) =>
                  d._id === dealId
                    ? {
                      ...d,
                      report: response.reports,
                      totalReportCount: response.totalReportCount,
                    }
                    : d,
                )
                : state.usersDeal,
              loading: false,
            }));
          } else {
            const errorMsg =
              response?.message || "Failed to report wholesale deal";
            set({ error: errorMsg, loading: false });
            throw new Error(errorMsg);
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error
              ? error.message
              : "Failed to report wholesale deal";
          set({ error: errorMsg, loading: false });
          throw error;
        }
      },
      reset: () =>
        set({
          loading: false,
          error: null,
          success: false,
          deals: null,
          selectedDeal: null,
        }),
      clear: () =>
        set({
          deals: null,
          loading: false,
          error: null,
          selectedDeal: null,
          success: false,
        }),
      _setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),
    }),
    {
      name: "wholesale-deal-store",
      // storage: createJSONStorage(() => AsyncStorage),
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        deals: state.deals, activeDeals: state.activeDeals,
        lastFetchedAt: state.lastFetchedAt,
      }),
      onRehydrateStorage: () => (state, err) => {
        state?._setHasHydrated(true);
        if (err) console.warn("WholesaleDeal rehydrate error", err);
      },
    },
  ),
);
