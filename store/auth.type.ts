import { OrderData } from "@/types/business.type";
import { SelectedSociety, Society } from "@/types/society.type";

export interface BusinessInfo {
  business_name?: string;
  category?: string;
  description?: string;
  website?: string;
  location?: string;
  gst_number?: string;
}

export interface LoginState {
  mobile: string;
  otp: string;
  loading: boolean;
  step: "mobile" | "otp";
}


export interface AddressVerificationType {
  status: string;
  rejectionReason?: string | null;
}

export type ManageProfilePayload = {
  fullName?: string;
  societyId?: string;
  towerId?: string;
  flatNo?: string;
  completeAddress?: string;
  mobileNumber?: string;
  email?: string;
  roles?: string[];
  isAddressVerified?: AddressVerificationType
};

export interface User {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
  completeAddress?: string;
  roles: string[];
  profilePhotoUrl?: string;
  isAddressVerified?: AddressVerificationType
  residentVerification?: {
    residentType?: string | null;
    residentProofType?: string | null;
    documentUrl?: string | null;
    selfieUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    locationUpdatedAt?: string | null;
    submittedAt?: string | null;
  };
  businessStatus?: AddressVerificationType
  verifyStatus?: string;
  tower?: string;
  flatNo?: string;
  societyId?: Society | string;
  businessIds?: { _id: string; verificationStatus: string; id: string }[];
  pendingBusinessCount?: number;
  selected_society?: SelectedSociety;
  orders?: OrderData[];
  report?: any[];
  totalReportCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  token: string | null;
  roles: string[] | null;
  expiresAt: string | null; // ISO string from backend
  _hasHydrated: boolean;

  // Loading states
  isSendingOtp: boolean;
  isVerifyingOtp: boolean;
}

export interface AuthActions {
  setToken: (t: string | null) => void;
  setRoles: (r: string[]) => void;
  setExpiresAt: (e: string | null) => void;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  signOut: () => void;
  clearAllStoreData: () => void;
  _setHasHydrated: (v: boolean) => void;

  // Session helpers
  initSession: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshIfNeeded: () => Promise<void>;


}

export type AuthStore = AuthState & AuthActions;