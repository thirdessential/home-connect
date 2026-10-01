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
  location?: {
    address?: string;
    latitude: number;
    longitude: number;
    updatedAt?: string | null;
  } | null;
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
  location?: {
    address?: string;
    latitude: number;
    longitude: number;
    updatedAt?: string | null;
  } | null;
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
  expiresAt: string | null; // access-token expiry, ISO string from backend
  /** Long-lived (30d) refresh token; kept in SecureStore with the rest of this slice. */
  refreshToken: string | null;
  refreshExpiresAt: string | null;
  /** Set when the session ended because it could not be recovered (not persisted). */
  sessionExpired: boolean;
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
  refreshIfNeeded: () => Promise<void>;
  /** Single-flight refresh. "invalid" => session ended (logged out); "network" => keep session. */
  refreshSession: () => Promise<"ok" | "invalid" | "network">;
  /** Refresh proactively when the access token is near expiry or the refresh token is in its final 5 days. */
  ensureFreshToken: () => Promise<void>;
  /** Unrecoverable session: clear everything and flag the "session expired" message. */
  expireSession: () => void;
  clearSessionExpired: () => void;


}

export type AuthStore = AuthState & AuthActions;
