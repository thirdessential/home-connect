import { Get } from "@/lib/httpMethods";
import { ReportItem } from "@/types/business.type";
import { create } from "zustand";
import { User } from "./auth.type";

// ─── Shared ────────────────────────────────────────────────────────────────

interface ReportedCollection<T> {
    total: number;
    items: T[];
}

const emptyCollection = <T>(): ReportedCollection<T> => ({
    total: 0,
    items: [],
});

// ─── Reported entity shapes (mirrors backend .select() fields) ─────────────

export interface ReportedUser {
    _id: string;
    fullName: string;
    phone?: string;
    roles: string[];
    profilePhotoUrl?: string;
    report?: ReportItem[];
    totalReportCount: number;
    createdAt?: string;
}

export interface ReportedBusiness {
    _id: string;
    title: string;
    category?: string;
    profilePhotoUrl?: string;
    userId?: Partial<User>;
    societyId?: string;
    report?: ReportItem[];
    totalReportCount: number;
    createdAt?: string;
}

export interface ReportedFeed {
    _id: string;
    title?: string;
    type?: string;
    user?: Partial<User>;
    society?: string;
    report?: ReportItem[];
    totalReportCount: number;
    createdAt?: string;
}

export interface ReportedDeal {
    _id: string;
    title?: string;
    category?: string;
    userId?: Partial<User>;
    societyId?: string;
    report?: ReportItem[];
    totalReportCount: number;
    createdAt?: string;
}

export interface ReportedDailyService {
    _id: string;
    name?: string;
    serviceType?: string;
    categoryId?: string;
    report?: ReportItem[];
    totalReportCount: number;
    createdAt?: string;
}

// ─── Pending entity shapes ────────────────────────────────────────────────

export interface PendingResident {
    _id: string;
    fullName: string;
    phone?: string;
    roles: string[];
    tower?: string;
    flatNo?: string;
    completeAddress?: string;
    profilePhotoUrl?: string;
    createdAt?: string;
    isAddressVerified?: {
        status: string;
        rejectionReason: string | null;
    };
}

export interface PendingBusiness {
    _id: string;
    title?: string;
    category?: string;
    profilePhotoUrl?: string;
    userId?: Partial<User>;
    societyId?: string;
    createdAt?: string;
}

export interface PendingDeal {
    _id: string;
    title?: string;
    category?: string;
    userId?: Partial<User>;
    societyId?: string;
    createdAt?: string;
}

export interface PendingDailyService {
    _id: string;
    name?: string;
    serviceType?: string;
    categoryId?: string;
    createdAt?: string;
}

// ─── Pending API response ──────────────────────────────────────────────────

interface GetAllPendingContentResponse {
    success: boolean;
    code: number;
    data: {
        pendingResidents: ReportedCollection<PendingResident>;
        pendingBusinesses: ReportedCollection<PendingBusiness>;
        pendingDeals: ReportedCollection<PendingDeal>;
        pendingDailyServices: ReportedCollection<PendingDailyService>;
        totalCount: number;
    };
}

// ─── Pending store shape ───────────────────────────────────────────────────

export interface PendingContent {
    residents: ReportedCollection<PendingResident>;
    businesses: ReportedCollection<PendingBusiness>;
    deals: ReportedCollection<PendingDeal>;
    dailyServices: ReportedCollection<PendingDailyService>;
    totalCount: number;
}

const initialPendingContent: PendingContent = {
    residents: emptyCollection(),
    businesses: emptyCollection(),
    deals: emptyCollection(),
    dailyServices: emptyCollection(),
    totalCount: 0,
};
// ─── Approved API response ────────────────────────────────────────────────────

export interface ApprovedResident {
    _id: string;
    fullName: string;
    phone?: string;
    roles: string[];
    tower?: string;
    flatNo?: string;
    completeAddress?: string;
    profilePhotoUrl?: string;
    createdAt?: string;
    isAddressVerified?: {
        status: string;
    };
}

export interface ApprovedBusiness {
    _id: string;
    title?: string;
    category?: string;
    phone?: string;
    email?: string | null;
    profilePhotoUrl?: string;
    userId?: Partial<User>;
    societyId?: string;
    createdAt?: string;
    verificationStatus?: {
        status: string;
    };
}

export interface ApprovedDailyService {
    _id: string;
    name?: string;
    serviceType?: string;
    categoryId?: string;
    createdAt?: string;
    verificationStatus?: {
        status: string;
    };
}

interface GetAllApprovedContentResponse {
    success: boolean;
    code: number;
    data: {
        approvedResidents: ReportedCollection<ApprovedResident>;
        approvedBusinesses: ReportedCollection<ApprovedBusiness>;
        approvedDailyServices: ReportedCollection<ApprovedDailyService>;
        totalCount: number;
    };
}

// ─── Approved store shape ──────────────────────────────────────────────────────

export interface ApprovedContent {
    residents: ReportedCollection<ApprovedResident>;
    businesses: ReportedCollection<ApprovedBusiness>;
    dailyServices: ReportedCollection<ApprovedDailyService>;
    totalCount: number;
}

const initialApprovedContent: ApprovedContent = {
    residents: emptyCollection(),
    businesses: emptyCollection(),
    dailyServices: emptyCollection(),
    totalCount: 0,
};
// ─── API response ──────────────────────────────────────────────────────────

interface GetAllReportedContentResponse {
    success: boolean;
    code: number;
    data: {
        reportedUsers: ReportedCollection<ReportedUser>;
        reportedBusinesses: ReportedCollection<ReportedBusiness>;
        reportedFeeds: ReportedCollection<ReportedFeed>;
        reportedDeals: ReportedCollection<ReportedDeal>;
        reportedDailyServices: ReportedCollection<ReportedDailyService>;
        totalCount: number;
    };
}

// ─── Store shape ───────────────────────────────────────────────────────────

export interface ReportedContent {
    users: ReportedCollection<ReportedUser>;
    businesses: ReportedCollection<ReportedBusiness>;
    feeds: ReportedCollection<ReportedFeed>;
    deals: ReportedCollection<ReportedDeal>;
    dailyServices: ReportedCollection<ReportedDailyService>;
    totalCount: number;
}

const initialReportedContent: ReportedContent = {
    users: emptyCollection(),
    businesses: emptyCollection(),
    feeds: emptyCollection(),
    deals: emptyCollection(),
    dailyServices: emptyCollection(),
    totalCount: 0,
};

export interface AdminStore {
    // ── State ──────────────────────────────────────────────────────────────
    reportedContent: ReportedContent;
    reportedContentLoading: boolean;
    reportedContentError: string | null;

    pendingContent: PendingContent;
    pendingContentLoading: boolean;
    pendingContentError: string | null;

    approvedContent: ApprovedContent;
    approvedContentLoading: boolean;
    approvedContentError: string | null;

    // ── Actions ────────────────────────────────────────────────────────────

    /** Fetch all reported content for a specific society */
    getAllReportedContent: (societyId: string) => Promise<void>;

    /** Fetch all pending approval requests for a specific society */
    getAllPendingContent: (societyId: string) => Promise<void>;

    /** Fetch all approved content for a specific society */
    getAllApprovedContent: (societyId: string) => Promise<void>;

    /** Optimistically remove a user from the reported users list */
    removeReportedUser: (userId: string) => void;

    /** Optimistically remove a business from the reported businesses list */
    removeReportedBusiness: (businessId: string) => void;

    /** Optimistically remove a feed from the reported feeds list */
    removeReportedFeed: (feedId: string) => void;

    /** Optimistically remove a deal from the reported deals list */
    removeReportedDeal: (dealId: string) => void;

    /** Optimistically remove a daily service from the reported services list */
    removeReportedDailyService: (serviceId: string) => void;

    /** Generic reset for the whole store */
    clear: () => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useAdminStore = create<AdminStore>()((set, get) => ({
    // ── Initial state ────────────────────────────────────────────────────────
    reportedContent: initialReportedContent,
    reportedContentLoading: false,
    reportedContentError: null,

    pendingContent: initialPendingContent,
    pendingContentLoading: false,
    pendingContentError: null,

    approvedContent: initialApprovedContent,
    approvedContentLoading: false,
    approvedContentError: null,

    // ── Actions ──────────────────────────────────────────────────────────────

    getAllReportedContent: async (societyId: string) => {
        set({ reportedContentLoading: true, reportedContentError: null });
        try {
            const response = await Get<GetAllReportedContentResponse>(
                `/api/admin/reported/${societyId}`,
            );

            if (response?.success && response.data) {
                const { data } = response;

                set({
                    reportedContent: {
                        users: data.reportedUsers,
                        businesses: data.reportedBusinesses,
                        feeds: data.reportedFeeds,
                        deals: data.reportedDeals,
                        dailyServices: data.reportedDailyServices,
                        totalCount: data.totalCount,
                    },
                    reportedContentLoading: false,
                });
            } else {
                set({
                    reportedContentError: "Failed to fetch reported content",
                    reportedContentLoading: false,
                });
            }
        } catch (err: any) {
            set({
                reportedContentError:
                    err?.message || "Failed to fetch reported content",
                reportedContentLoading: false,
            });
        }
    },

    getAllPendingContent: async (societyId: string) => {
        set({ pendingContentLoading: true, pendingContentError: null });
        try {
            const response = await Get<GetAllPendingContentResponse>(
                `/api/admin/pending-requests/${societyId}`,
            );
            if (response?.success && response.data) {
                const { data } = response;
                set({
                    pendingContent: {
                        residents: data.pendingResidents,
                        businesses: data.pendingBusinesses,
                        deals: data.pendingDeals,
                        dailyServices: data.pendingDailyServices,
                        totalCount: data.totalCount,
                    },
                    pendingContentLoading: false,
                });
            } else {
                set({
                    pendingContentError: "Failed to fetch pending content",
                    pendingContentLoading: false,
                });
            }
        } catch (err: any) {
            set({
                pendingContentError: err?.message || "Failed to fetch pending content",
                pendingContentLoading: false,
            });
        }
    },

    getAllApprovedContent: async (societyId: string) => {
        set({ approvedContentLoading: true, approvedContentError: null });
        try {
            const response = await Get<GetAllApprovedContentResponse>(
                `/api/admin/approved/${societyId}`,
            );
            if (response?.success && response.data) {
                const { data } = response;
                set({
                    approvedContent: {
                        residents: data.approvedResidents ?? emptyCollection(),
                        businesses: data.approvedBusinesses ?? emptyCollection(),
                        dailyServices: data.approvedDailyServices ?? emptyCollection(),
                        totalCount: data.totalCount ?? 0,
                    },
                    approvedContentLoading: false,
                });
            } else {
                set({
                    approvedContentError: "Failed to fetch approved content",
                    approvedContentLoading: false,
                });
            }
        } catch (err: any) {
            set({
                approvedContentError: err?.message || "Failed to fetch approved content",
                approvedContentLoading: false,
            });
        }
    },

    removeReportedUser: (userId: string) => {
        const { reportedContent } = get();
        const filteredItems = reportedContent.users.items.filter(
            (u) => u._id !== userId,
        );
        set({
            reportedContent: {
                ...reportedContent,
                users: {
                    items: filteredItems,
                    total: filteredItems.length,
                },
                totalCount: Math.max(0, reportedContent.totalCount - 1),
            },
        });
    },

    removeReportedBusiness: (businessId: string) => {
        const { reportedContent } = get();
        const filteredItems = reportedContent.businesses.items.filter(
            (b) => b._id !== businessId,
        );
        set({
            reportedContent: {
                ...reportedContent,
                businesses: {
                    items: filteredItems,
                    total: filteredItems.length,
                },
                totalCount: Math.max(0, reportedContent.totalCount - 1),
            },
        });
    },

    removeReportedFeed: (feedId: string) => {
        const { reportedContent } = get();
        const filteredItems = reportedContent.feeds.items.filter(
            (f) => f._id !== feedId,
        );
        set({
            reportedContent: {
                ...reportedContent,
                feeds: {
                    items: filteredItems,
                    total: filteredItems.length,
                },
                totalCount: Math.max(0, reportedContent.totalCount - 1),
            },
        });
    },

    removeReportedDeal: (dealId: string) => {
        const { reportedContent } = get();
        const filteredItems = reportedContent.deals.items.filter(
            (d) => d._id !== dealId,
        );
        set({
            reportedContent: {
                ...reportedContent,
                deals: {
                    items: filteredItems,
                    total: filteredItems.length,
                },
                totalCount: Math.max(0, reportedContent.totalCount - 1),
            },
        });
    },

    removeReportedDailyService: (serviceId: string) => {
        const { reportedContent } = get();
        const filteredItems = reportedContent.dailyServices.items.filter(
            (s) => s._id !== serviceId,
        );
        set({
            reportedContent: {
                ...reportedContent,
                dailyServices: {
                    items: filteredItems,
                    total: filteredItems.length,
                },
                totalCount: Math.max(0, reportedContent.totalCount - 1),
            },
        });
    },

    clearReportedContent: () => {
        set({ reportedContent: initialReportedContent, reportedContentError: null });
    },

    clear: () => {
        set({
            reportedContent: initialReportedContent,
            reportedContentLoading: false,
            reportedContentError: null,
            pendingContent: initialPendingContent,
            pendingContentLoading: false,
            pendingContentError: null,
            approvedContent: initialApprovedContent,
            approvedContentLoading: false,
            approvedContentError: null,
        });
    },
}));
