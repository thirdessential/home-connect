import { Review } from "@/components/reviews/ReviewsBlock";
import { AddressVerificationType, User } from "@/store/auth.type";
import { StyleProp, ViewStyle } from "react-native";

export interface BusinessCategory {
    id: string;
    name: string;
    icon?: string;
    value?: boolean | string;
    subtext?: string;
    // Poll-specific fields
    votes?: number;
    percentage?: number;
}

// below can be cheked later
export interface ProductList {
    _id: string;
    title: string;
    summary?: string;
    imageUrl?: string;
    maxOrder?: number;
    rating?: string;
    price?: string;
    currency?: string;
    sellerType?: string;
    mrp?: string;
    category?: string;
    categoryId?: string[];
    itemType?: string;
    verifiedStatus?: string;
    status?: string;
    unit?: string;
    saveRs?: string;
    createdAt?: string;
    updatedAt?: string;
    deadline?: string;
    endDate?: string;
    mobileNumber?: string;
    businessNumber?: string;
    currentOrder?: number;
}

export interface ProductCardProps extends ProductList {
    imageUrl?: string;
    type?: string;
    ctaName?: string; // New prop for button text
    buttonText?: string; // default: "Action"
    loading?: boolean;
    disabled?: boolean;
    imageHeight?: number; // default: 160
    style?: StyleProp<ViewStyle>;
    testID?: string;
    onPress?: () => void; // Add onPress to ProductCardProps
}

export interface ProductListProps {
    products: ProductList[];
    onPressProductItem: (id: string) => void;
}

export interface DealOptions {
    cashOnDelivery?: boolean;
    moneyBackGuarantee?: boolean;
    openBoxDelivery?: boolean;
    freeSamples?: boolean;
}

export interface ProductPrice {
    mrp: string;
    discountPrcnt: string;
    sellingPrice: string;
    saveAmount: string;
}

export interface ReportItem {
    userId: string | Partial<User>;
    reason: string;
    createdAt?: string;
}

export interface BusinessCatalogue {
    _id?: string;
    title: string;
    description?: string;
    price: number;
    mrp?: number;
    images?: string[]; // Array of image URLs
    unit?: string; // e.g., kg, piece
    itemType?: string; // e.g., product, service
    email?: string;
    gstNumber?: string;
    inStock?: string;
    rating?: number;
    likeCount?: number;
    tags?: string[];
    businessId?: string;
}

export interface Product {
    _id?: string;
    title?: string;
    name?: string;
    description?: string;
    phone?: string;
    userId?: string | Partial<User>;
    completeAddress?: string;
    city?: string;
    state?: string;
    images?: string[];
    price?: ProductPrice;
    email?: string;
    gstNumber?: string;
    businessPhone?: string;
    shopTimings?: BusinessCategory;
    profilePhotoUrl?: string;
    catalogue?: BusinessCatalogue[];
    category?: string;
    categoryId?: string[];
    avgRating?: number;
    itemType?: string;
    rating?: string;
    report?: ReportItem[];
    totalReportCount?: number;
    reviews?: Review[];
    societyId?: string;
    verificationStatus?: AddressVerificationType;
    updatedAt?: string;
    createdAt?: string;
}

export type ProductStore = {
    product: Product | null;
    userProducts: Product[] | null;
    productList: Product[] | null;
    businessReviews: Record<string, any[]>;
    loading: boolean;
    pendingReq?: number;
    pendingBusinessReq?: number;
    totalCount: number;
    error: string | null;
    _hasHydrated: boolean;
    setProduct: (product: Product | null) => void;
    fetchBusinessBySocietyId: (societyId: string) => Promise<void>;
    getProductById: (productId: string) => Promise<void>;
    createProduct: (product: Partial<Product>) => Promise<void>;
    updateProduct: (
        product: Partial<Product>,
        productId: string,
    ) => Promise<void>;
    getUserBusinesses: (userId: string) => Promise<void>;
    getAllBusinesses: (societyId: string) => Promise<void>;
    reportBusiness: (
        businessId: string,
        userId: string,
        reason: string,
    ) => Promise<void>;
    updateBusinessVerificationStatus: (
        businessId: string,
        userId: string,
        status: string,
        rejectionReason?: string,
    ) => Promise<void>;
    addCatalogueItem: (
        businessId: string,
        catalogue: BusinessCatalogue,
    ) => Promise<void>;
    updateCatalogueItem: (
        businessId: string,
        catalogueId: string,
        catalogue: Partial<BusinessCatalogue>,
    ) => Promise<void>;
    getCatalogueByBusinessId: (businessId: string) => Promise<void>;
    addOrUpdateBusinessReview: (
        businessId: string,
        userId: string,
        reviewData: {
            rating: number;
            comment: string;
            userName?: string;
            profilePhotoUrl?: string;
        },
    ) => Promise<any>;
    clear: () => void;
    _setHasHydrated: (v: boolean) => void;
};

export interface DailyHelperStore {
    dailyHelper: DailyHelper | null;
    dailyHelperList: DailyHelper[] | null;
    pendingReq?: number;
    totalCount: number;
    approvedReq?: number;
    error: string | null;
    loading: boolean;
    _hasHydrated: boolean;
    setDailyHelper: (service: DailyHelper | null) => void;
    createDailyHelper: (service: Partial<DailyHelper>) => Promise<void>;
    getAllApprovedDailyServices: (societyId: string) => Promise<void>;
    getHelperById: (helperId: string) => Promise<void>;
    reportService: (
        helperId: string,
        userId: string,
        reason: string,
    ) => Promise<void>;
    updateDailyService: (
        service: Partial<DailyHelper>,
        serviceId: string,
    ) => Promise<void>;
    getAllDailyServicesBySocietyId: (societyId: string) => Promise<void>;
    addDailyServiceReview: (helperId: string, review: Review) => Promise<void>;
    clear: () => void;
    _setHasHydrated: (v: boolean) => void;
}

export interface Order {
    orderId?: string;
    userId?: string;
    quantity?: number;
    amount?: number;
    status?: string;
    dealerName?: string;
    delivery?: {
        address?: string;
        phone?: string;
    };
    orderedAt?: string;
    updatedAt?: string;
}

export interface WorkingHour {
    dayPreset: string;
    timeSlot: string;
    displayText: string;
}

export interface PricingRow {
    rate: string;
    subtext: string;
}
export interface DailyHelper {
    _id: string;
    name: string;
    phone: string;
    serviceType?: string;
    images?: string[];
    rate?: string;
    address?: string;
    additionalInfo?: string;
    pricingRates?: PricingRow[];
    workingHours?: WorkingHour;
    description?: string;
    categoryId?: string;
    averageRating?: number;
    verificationStatus?: AddressVerificationType;
    reviews?: Review[];
    userIds?: string[];
    societyIds?: string[];
    report?: ReportItem[];
    totalReportCount?: number;
    createdBy?: string | Partial<User>;
    createdAt?: string;
    updatedAt?: string;
}
export interface WholesaleDeal {
    _id: string;
    title: string;
    phone: string;
    images?: string[];
    description?: string;
    category?: string;
    orders?: Order[];
    quantityAvailable?: number;
    quantityUnit?: string;
    minimumOrderQty?: number;
    maximumOrderQty?: number;
    currentOrderedQty?: number;
    price?: ProductPrice;
    unit?: string;
    userId?: Partial<User> | string;
    societyId?: string;
    categoryId?: string[];
    orderDeadlineDate?: string;
    estimatedDeliveryDate?: string;
    isDealActive?: boolean;
    dealStatus?: string;
    dealOptions?: DealOptions;
    verificationStatus?: AddressVerificationType;
    report?: ReportItem[];
    totalReportCount?: number;
    reviews?: Review[];
    createdAt?: string;
    updatedAt?: string;
}

export interface OrderData {
    userId?: string;
    orderId?: string;
    sourceId?: string;
    sourceType?: "wholesale" | "retail";
    quantity?: number;
    amount?: number;
    dealerName: string;
    status?: "pending" | "confirmed" | "cancelled" | "delivered";
    _id?: string;
    orderedAt?: Date;
    updatedAt?: Date;
    delivery?: {
        address?: string;
        phone?: string;
    };
}

export interface WholesaleDealStore {
    loading: boolean;
    error: string | null;
    success: boolean;
    pendingReq?: number;
    activeDeals: WholesaleDeal[] | null;
    activeDealsCount?: number;
    totalCount: number;
    selectedDeal?: WholesaleDeal | null;
    deals: WholesaleDeal[] | null;
    lastFetchedAt: number | null;
    usersDeal: WholesaleDeal[] | null;
    _hasHydrated: boolean;

    // Local state helpers
    setSelectedDeal: (deal: WholesaleDeal | null) => void;
    updateSelectedDeal: (patch: Partial<WholesaleDeal>) => void;
    addDealOptimistically: (deal: WholesaleDeal) => void;

    createDeal: (dealData: Partial<WholesaleDeal>) => Promise<void>;
    getAllDealsBySocietyId: (societyId: string) => Promise<void>;
    getDealsByUserId: (userId: string) => Promise<void>;
    updateDeal: (deal: Partial<WholesaleDeal>, dealId: string) => Promise<void>;
    removeDeal: (dealId: string) => Promise<void>;
    getDealById: (dealId: string) => Promise<void>;
    reportDeal: (dealId: string, userId: string, reason: string) => Promise<void>;
    updateExpiredDeals: (societyId: string) => Promise<void>;
    upsertWholesaleOrder: (
        dealId: string,
        orderData: Partial<OrderData>,
    ) => Promise<void>;
    reset: () => void;
    clear: () => void;
    _setHasHydrated: (v: boolean) => void;
    updateOrderStatus: (
        dealId: string,
        orderId: string,
        status:
            | "approved"
            | "rejected"
            | "pending"
            | "delivered"
            | "confirmed"
    ) => Promise<void>;
}
