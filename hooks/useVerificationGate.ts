import { usePermissions } from "@/hooks/usePermissions";
import { UserRole } from "@/types/roles";
import { useCallback, useState } from "react";

// Mirrors HomeScreen's `showVerificationChrome` — anyone who isn't an
// approved resident/admin (guest, or submitted-but-pending/rejected) must
// verify before mutating data or opening a protected screen. Reused here so
// every gated entry point (Join Event, Event/Directory Details, Create) shares
// the exact same "who is blocked" rule instead of each screen guessing its own.
export function useVerificationGate() {
  const { hasAnyRole, isResidentVerified } = usePermissions();
  const isAdmin = hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const requiresVerification = !isAdmin && !isResidentVerified;

  const [gate, setGate] = useState<{ visible: boolean; mode: "action" | "page" }>({
    visible: false,
    mode: "action",
  });

  // Returns true if the caller may proceed. If verification is required, it
  // opens the shared prompt and returns false — callers must bail out (no
  // API call, no navigation) rather than proceeding optimistically.
  const requireVerified = useCallback(
    (mode: "action" | "page" = "action") => {
      if (requiresVerification) {
        setGate({ visible: true, mode });
        return false;
      }
      return true;
    },
    [requiresVerification],
  );

  const closeGate = useCallback(() => setGate((g) => ({ ...g, visible: false })), []);

  return { requiresVerification, requireVerified, gate, closeGate };
}
