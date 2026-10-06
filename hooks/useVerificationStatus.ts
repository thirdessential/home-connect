import { verificationStatus } from "@/assets/enums/common.enum";
import { useBusinessRegistrationStore } from "@/store/useBusinessRegistrationStore";
import { useUserStore } from "@/store/useUserStore";

/**
 * Single source for "is this user's verification request waiting on an admin?".
 *
 * The backend defaults a never-submitted user's status to "pending", so the
 * resident status alone cannot tell "never submitted" from "pending" — the
 * submission timestamp can. A pending business registration counts too: while
 * either request is under review no verification form may be opened.
 * Everything here is read from the backend-synced user/business stores.
 */
export function useVerificationStatus() {
  const status = useUserStore((s) => s.user?.isAddressVerified?.status);
  const submittedAt = useUserStore((s) => s.user?.residentVerification?.submittedAt);
  const pendingBusinessCount = useUserStore((s) => s.user?.pendingBusinessCount);
  const userBusinessStatus = useUserStore((s) => s.user?.businessStatus?.status);
  const regBusinessStatus = useBusinessRegistrationStore((s) => s.business?.business_status);

  const residentPending = !!submittedAt && status === verificationStatus.PENDING;
  const businessPending =
    userBusinessStatus === verificationStatus.PENDING ||
    regBusinessStatus === "pending" ||
    (pendingBusinessCount ?? 0) > 0;

  return {
    residentPending,
    businessPending,
    isVerificationPending: residentPending || businessPending,
    hasSubmittedResident: !!submittedAt,
  };
}

export const VERIFICATION_PENDING_TITLE = "Verification Pending";
export const VERIFICATION_PENDING_MESSAGE =
  "Your verification request has been submitted and is waiting for admin approval.";
