import { verificationStatus } from "@/assets/enums/common.enum";
import { Delete, Get, Patch, Post, Put } from "@/lib/httpMethods";
import { ReportItem } from "@/types/business.type";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { zustandStorage } from "@/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AddressVerificationType, User } from "./auth.type";

export interface UserStore {
    user: User | null;
    viewedUser: User | null;
    viewedUserLoading: boolean;
    users: User[];
    approvedResidents?: User[];
    userOrders?: any[];
    userOrdersLoading?: boolean;
    userOrdersLastFetched?: number;
    approvedResidentsCount?: number;
    pendingResidentsCount?: number;
    isAddressVerified: AddressVerificationType | null;
    loading: boolean;
    error: string | null;
    existingUserId?: string | null;
    _hasHydrated: boolean;
    setUser: (user: User | null) => void;
    setViewedUser: (user: User | null) => void;
    fetchViewedUser: (_id: string) => Promise<void>;
    setApprovedResidents: (residents: User[]) => void;
    updateUserField: (field: keyof User, value: any) => void;
    fetchUser: (_id: string) => Promise<void>;
    saveLocation: (payload: {
        address?: string;
        latitude: number;
        longitude: number;
    }) => Promise<void>;
    createUser: (user: Partial<User>) => Promise<void>;
    syncUserBusinessIds: () => Promise<void>;
    syncUserBusinessIdsWithStatus: (userId: string) => Promise<void>;
    getPendingUsersBySocietyId: (societyId: string) => Promise<void>;
    getAllUserBySocietyId: (_id: string) => Promise<void>;
    updateUser: (user: Partial<User>, userId: string) => Promise<void>;
    getUserOrders: (userId: string) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    checkBusinessCreationAuthorization: (userId: string) => Promise<{
        isAuthorized: boolean;
        businessCount: number;
        userRole: string[];
        reason: string;
    }>;
    reportUser: (
        userId: string,
        reporterId: string,
        reason: string,
    ) => Promise<void>;
    clear: () => void;
    _setHasHydrated: (v: boolean) => void;
}

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            user: null,
            viewedUser: null,
            viewedUserLoading: false,
            users: [],
            approvedResidents: [],
            isAddressVerified: null,
            loading: false,
            error: null,
            existingUserId: null,
            _hasHydrated: false,
            userOrdersLoading: false,
            userOrdersLastFetched: undefined,

            setUser: (user) => {
                set({ user, isAddressVerified: user?.isAddressVerified || null });
            },
            setViewedUser: (user) => {
                set({ viewedUser: user });
            },
            fetchViewedUser: async (_id: string) => {
                set({ viewedUserLoading: true, error: null });
                try {
                    const userResponse = await Get<User>(`/api/user/${_id}`);
                    if (userResponse?._id) {
                        set({ viewedUser: userResponse, viewedUserLoading: false });
                    } else {
                        set({ viewedUserLoading: false });
                    }
                } catch (err: any) {
                    set({ error: err?.message || "Failed to fetch user", viewedUserLoading: false });
                }
            },
            setApprovedResidents: (residents) => {
                set({ approvedResidents: residents });
            },
            updateUserField: (field, value) => {
                const currentUser = get().user;
                if (currentUser && typeof currentUser === "object") {
                    set({ user: { ...currentUser, [field]: value } });
                }
            },
            fetchUser: async (_id: string) => {
                set({ loading: true, error: null });
                try {
                    const userResponse = await Get<{ success: boolean; user: User }>(
                        `/api/user/${_id}`,
                    );
                    if (userResponse?.success) {
                        set({
                            user: userResponse?.user,
                            loading: false,
                            isAddressVerified: userResponse?.user?.isAddressVerified || null,
                        });
                    }
                } catch (err: any) {
                    set({
                        error: err?.message || "Failed to fetch user",
                        loading: false,
                    });
                }
            },
            saveLocation: async (payload) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{ success: boolean; user: User }>(
                        `/api/auth/save-location`,
                        payload,
                    );
                    if (response?.success) {
                        set({
                            user: response.user,
                            loading: false,
                            isAddressVerified: response.user?.isAddressVerified || null,
                        });
                    } else {
                        set({ error: "Failed to save location", loading: false });
                    }
                } catch (err: any) {
                    const errorMsg = err?.message || "Failed to save location";
                    set({ error: errorMsg, loading: false });
                    throw err;
                }
            },
            getUserOrders: async (userId: string) => {
                if (!userId) return;
                const { userOrdersLoading, userOrdersLastFetched } = get();
                // Dedupe: skip if already loading or fetched recently (15s TTL)
                const now = Date.now();
                if (userOrdersLoading) return;
                if (userOrdersLastFetched && now - userOrdersLastFetched < 15_000)
                    return;

                set({ userOrdersLoading: true, error: null });
                try {
                    const response = await Get<{
                        success: boolean;
                        orders: any[];
                        totalOrders: number;
                    }>(`/api/user/${userId}/orders`);
                    if (response?.success) {
                        set({
                            userOrders: response.orders,
                            userOrdersLoading: false,
                            userOrdersLastFetched: now,
                        });
                    } else {
                        set({ userOrdersLoading: false });
                    }
                } catch (err: any) {
                    set({
                        error: err?.message || "Failed to fetch user orders",
                        userOrdersLoading: false,
                    });
                }
            },
            createUser: async (user: Partial<User>) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{
                        code: number;
                        newUser?: User;
                        message?: string;
                    }>(`/api/user`, user);
                    if (response?.code === 201 && response.newUser) {
                        set({
                            user: response.newUser,
                            loading: false,
                            isAddressVerified: response.newUser?.isAddressVerified || null,
                            existingUserId: response.newUser._id,
                        });
                    } else if (response?.code === 404 && response?.newUser) {
                        set({ existingUserId: response.newUser._id, loading: false });
                    } else {
                        set({
                            error: response?.message || "Failed to create user",
                            loading: false,
                        });
                    }
                } catch (error: any) {
                    // Handle structured error from httpMethods with status/body
                    if (error?.status === 404 && error?.body?.userId) {
                        set({ existingUserId: error.body.userId, loading: false });
                    } else {
                        set({
                            error: error?.message || "Failed to create user",
                            loading: false,
                        });
                    }
                }
            },
            updateUser: async (userUpdate: Partial<User>, userId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Patch<{ code: number; user: User }>(
                        `/api/user/${userId}`,
                        userUpdate,
                    );
                    if (response?.code === 200) {
                        const updatedUser = response.user;
                        // Update both single user and users list
                        const currentUsers = get().users;
                        const updatedUsers = currentUsers.map((u) =>
                            u._id === userId ? { ...u, ...updatedUser } : u,
                        );
                        const currentUser = get().user;
                        const isSelf = currentUser?._id === userId;
                        set({
                            ...(isSelf ? { user: updatedUser, isAddressVerified: updatedUser?.isAddressVerified || null } : {}),
                            users: updatedUsers,
                            loading: false,
                        });
                    } else {
                        const errorMsg = "Failed to update user";
                        set({ error: errorMsg, loading: false });
                        throw new Error(errorMsg);
                    }
                } catch (err: any) {
                    const errorMsg = err?.message || "Failed to update user";
                    set({ error: errorMsg, loading: false });
                    throw err;
                }
            },
            syncUserBusinessIds: async () => {
                const user = get().user;
                if (!user) return;

                set({ loading: true, error: null });
                try {
                    const response = await Get<{ code: number; user: User }>(
                        `/api/user/sync/${user._id}`,
                    );
                    if (response?.code === 200) {
                        set({
                            user: response.user,
                            loading: false,
                            isAddressVerified: response.user?.isAddressVerified || null,
                        });
                    } else {
                        set({ error: "Failed to sync user business IDs", loading: false });
                    }
                } catch (err: any) {
                    set({
                        error: err?.message || "Failed to sync user business IDs",
                        loading: false,
                    });
                }
            },
            syncUserBusinessIdsWithStatus: async (userId: string) => {
                if (!userId) return;
                try {
                    const response = await Put<{
                        success: boolean;
                        code: number;
                        user: User;
                        message?: string;
                    }>(`/api/user/sync-status/${userId}`, {});
                    if (response?.success && response?.code === 200 && response?.user) {
                        // Update the user in the users list if present
                        const currentUsers = get().users;
                        const updatedUsers = currentUsers.map((u) =>
                            u._id === userId ? { ...u, ...response.user } : u,
                        );
                        set({ users: updatedUsers });
                        // Also update current user if it's the same
                        const currentUser = get().user;
                        if (currentUser?._id === userId) {
                            set({
                                user: response.user,
                                isAddressVerified: response.user?.isAddressVerified || null,
                            });
                        }
                    }
                    // Silently ignore non-success responses (user may not have businesses)
                } catch {
                    // Silently ignore errors
                }
            },
            getAllUserBySocietyId: async (_id: string) => {
                set({ loading: true, error: null });
                try {
                    const userResponse = await Get<{
                        success: boolean;
                        code: number;
                        users: User[];
                    }>(`/api/user/getUsers/${_id}`);
                    if (userResponse?.code === 200 && userResponse?.success) {
                        const allUsers = userResponse?.users || [];
                        // Filter approved residents where isAddressVerified.status is "approved"
                        const approved = allUsers.filter(
                            (u) =>
                                u.isAddressVerified?.status?.toLowerCase() ===
                                verificationStatus.APPROVED,
                        );
                        set({
                            users: allUsers,
                            approvedResidents: approved,
                            approvedResidentsCount: approved.length,
                            loading: false,
                        });
                    }
                } catch (err: any) {
                    set({
                        error: err?.message || "Failed to fetch user",
                        loading: false,
                    });
                }
            },
            getPendingUsersBySocietyId: async (societyId: string) => {
                set({ loading: true, error: null });
                try {
                    const userResponse = await Get<{
                        success: boolean;
                        code: number;
                        users: User[];
                    }>(`/api/user/getPendingUsers/${societyId}`);
                    if (userResponse?.code === 200 && userResponse?.success) {
                        set({ users: userResponse?.users, loading: false });
                    }
                } catch (err: any) {
                    set({
                        error: err?.message || "Failed to fetch user",
                        loading: false,
                    });
                }
            },
            deleteUser: async (userId: string) => {
                if (!userId) return;
                set({ loading: true, error: null });
                try {
                    const response = await Delete<{
                        code: number;
                        success: boolean;
                        message?: string;
                    }>(`/api/user/${userId}`);
                    if (response?.code === 200 && response?.success) {
                        // Remove user from users list if present
                        const currentUsers = get().users;
                        const updatedUsers = currentUsers.filter((u) => u._id !== userId);

                        // Remove user from approvedResidents if present
                        const currentApprovedResidents = get().approvedResidents || [];
                        const updatedApprovedResidents = currentApprovedResidents.filter(
                            (u) => u._id !== userId,
                        );

                        set({
                            users: updatedUsers,
                            approvedResidents: updatedApprovedResidents,
                            approvedResidentsCount: updatedApprovedResidents.length,
                            loading: false,
                        });
                        // Clear current user if it's the same user being deleted
                        const currentUser = get().user;
                        if (currentUser?._id === userId) {
                            set({ user: null, isAddressVerified: null });
                        }
                    } else {
                        set({ error: "Failed to delete user", loading: false });
                    }
                } catch (err: any) {
                    set({
                        error: err?.message || "Failed to delete user",
                        loading: false,
                    });
                }
            },
            checkBusinessCreationAuthorization: async (userId: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await Get<{
                        success: boolean;
                        code: number;
                        isAuthorized: boolean;
                        businessCount: number;
                        userRole: string[];
                        reason: string;
                    }>(`/api/user/permission/${userId}`);

                    if (response?.success) {
                        set({ loading: false });
                        return {
                            isAuthorized: response.isAuthorized,
                            businessCount: response.businessCount,
                            userRole: response.userRole,
                            reason: response.reason,
                        };
                    } else {
                        const errorMsg = "Failed to check business creation authorization";
                        set({ error: errorMsg, loading: false });
                        throw new Error(errorMsg);
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : "Failed to check business creation authorization";
                    set({ error: errorMsg, loading: false });
                    throw error;
                }
            },
            reportUser: async (
                userId: string,
                reporterId: string,
                reason: string,
            ) => {
                set({ loading: true, error: null });
                try {
                    const response = await Post<{
                        success: boolean;
                        code: number;
                        message: string;
                        totalReportCount: number;
                        reports: ReportItem[];
                    }>(`/api/user/report/${userId}`, { userId: reporterId, reason });

                    if (response?.success && response?.code === 200) {
                        // Update the user with the new report count and reports
                        set((state) => ({
                            user:
                                state.user?._id === userId
                                    ? {
                                        ...state.user,
                                        report: response.reports,
                                        totalReportCount: response.totalReportCount,
                                    }
                                    : state.user,
                            users: state.users.map((u) =>
                                u._id === userId
                                    ? {
                                        ...u,
                                        report: response.reports,
                                        totalReportCount: response.totalReportCount,
                                    }
                                    : u,
                            ),
                            approvedResidents: state.approvedResidents
                                ? state.approvedResidents.map((u) =>
                                    u._id === userId
                                        ? {
                                            ...u,
                                            report: response.reports,
                                            totalReportCount: response.totalReportCount,
                                        }
                                        : u,
                                )
                                : state.approvedResidents,
                            loading: false,
                        }));
                    } else {
                        const errorMsg = response?.message || "Failed to report user";
                        set({ error: errorMsg, loading: false });
                        throw new Error(errorMsg);
                    }
                } catch (error) {
                    const errorMsg =
                        error instanceof Error ? error.message : "Failed to report user";
                    set({ error: errorMsg, loading: false });
                    throw error;
                }
            },
            clear: () =>
                set({
                    user: null,
                    viewedUser: null,
                    viewedUserLoading: false,
                    loading: false,
                    error: null,
                    users: [],
                    approvedResidents: [],
                    approvedResidentsCount: undefined,
                    pendingResidentsCount: undefined,
                    isAddressVerified: null,
                    existingUserId: null,
                    userOrders: undefined,
                    userOrdersLoading: false,
                    userOrdersLastFetched: undefined,
                }),
            _setHasHydrated: (v) => set({ _hasHydrated: v }),
        }),
        {
            name: "user-store",
            // storage: createJSONStorage(() => AsyncStorage),
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({ user: state.user }),
            onRehydrateStorage: () => (state, err) => {
                state?._setHasHydrated(true);
                if (err) console.warn("User rehydrate error", err);
            },
        },
    ),
);
