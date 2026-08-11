import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { BusinessCategory, ProductList, WholesaleDeal } from "./business.type";

export type ButtonVariant = "primary" | "outline" | "ghost";
export type Padding = "none" | "sm" | "md" | "lg";
export type Elevation = "low" | "medium" | "high";

export interface RoleCardProps {
    title: string;
    subtitle: string;
    color: "blue" | "yellow" | "green";
    iconName?: string;
    onPress?: () => void;
    testID?: string;
};

export interface ProductLite {
    id: string | number;
    title: string;
    price?: number;
    currency?: string
    url?: string; // public web url (if you have), else we’ll build a deep link
};

export interface CustomerReviewProps {
    reviews: Review[];
    onAddReview: () => void;
    containerStyle?: ViewStyle;
    disabled?: boolean;
}

export interface AddReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (review: Omit<Review, "_id" | "createdAt" | "userName">) => void;
    businessName?: string;
    businessId?: string;
    userId?: string;
}

export interface FilterChipsProps {
    options: BusinessCategory[];
    initialValue?: string;
    onChange: (value: string) => void;
    style?: any;
}

export interface ShareButtonProps {
    product?: ProductLite;
    message?: string; // override full share text
    url?: string; // optional url (iOS uses native url field)
    subject?: string; // iOS/Android share sheet title
    icon?: keyof typeof Ionicons.glyphMap; // default: "share-social-outline"
    size?: number; // diameter, default: 40
    bgColor?: string; // default: theme.colors.surfaceAlt
    iconColor?: string; // default: theme.colors.primary
    style?: ViewStyle;
    stopPropagation?: boolean; // default: true (prevents parent TouchableOpacity firing)
    onShared?: (success: boolean) => void;
    disabled?: boolean;
};

export interface TabViewProps {
    activeTab: "details" | "faq";
    onTabChange: (tab: "details" | "faq") => void;
};

export interface ReplyModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (answer: string) => void;
    questionContent: string;
    questionAuthor: string;
};

export interface ProductCarouselProps {
    products: WholesaleDeal[] | ProductList[];
    ctaName?: string;
    onPressProductItem: (id: string) => void;
    style?: ViewStyle; // extra style for the container
    loading?: boolean;
}

export interface Review {
    _id?: string;
    userName?: string;
    rating?: number;
    comment?: string;
    createdAt?: string;
    userId?: string;
    profilePhotoUrl?: string;
}

export interface ServiceProvider {
    id: string;
    name: string;
    category: string;
    rating: number;
    reviewCount: number;
    imageUrl: string;
    businessPhone?: string;
    catalogue?: any[];
    city?: string;
    completeAddress?: string;
    createdAt?: string;
    productType: "business" | "daily-helper" | "professional-service";
};

export type InfoBannerType = "info" | "success" | "warning" | "danger";

export interface InfoBannerProps {
    type?: InfoBannerType;
    title?: string;
    description?: React.ReactNode;
    backgroundColor?: string;
    borderColor?: string;
    titleColor?: string;
    descriptionColor?: string;
    containerStyle?: ViewStyle;
};

export interface DashboardStatsProps {
    firstIconName: keyof typeof Ionicons.glyphMap;
    firstCount: string | number;
    firstLabel: string;
    secondIconName: keyof typeof Ionicons.glyphMap;
    secondCount: string | number;
    secondLabel: string;
};

export interface RegisterHelperModalProps {
    visible: boolean;
    onClose: () => void;
};

export interface OptionItem {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    path: string;
    subtitle?: string;
    disabled: boolean;
    color?: string;
}

export interface DailyServiceCardProps {
    title: string;
    summary?: string;
    imageUrl?: string;
    hideCta?: boolean;
    onPress?: () => void;
    onCall?: () => void;
};

export interface UpdateFormModalProps {
    modalVisible: boolean;
    setModalVisible: (v: boolean) => void;
    selectedDeal: any;
    setSelectedDeal: (deal: any) => void;
    newOrderQuantity: string;
    setNewOrderQuantity: (v: string) => void;
    handleConfirmUpdate: () => void;
}

export interface WhatsAppMessageParams {
    phone: string | undefined;
    message?: string;
    productDetails?: {
        name: string;
        price?: string | number;
    };
}

export interface AskQuestionModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (question: string) => void;
    productName: string;
};

export interface ReportReason {
    id: string;
    label: string;
}

export interface ReportButtonProps {
    title?: string;
    message?: string;
    reasons?: ReportReason[];
    iconName?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBackgroundColor?: string;
    label?: string;
    containerStyle?: any;
    loading?: boolean;
    onReport: (reason: string) => Promise<void> | void;
}

export interface CardWrapperProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    KeyId?: string;
}