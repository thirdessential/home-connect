import VerificationPendingView from "@/components/verification/VerificationPendingView";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { useBusinessRegistrationStore } from "@/store/useBusinessRegistrationStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Wraps every screen that renders a verification form. A pending user can't
 * reach the form by any route: the latest backend state is fetched first (the
 * form never renders against stale state), and a pending request shows
 * "Verification Pending" instead. If the refresh fails (offline) the cached
 * state is used. The backend rejects a duplicate submission regardless.
 */
export default function VerificationRouteGuard({ children, bypass = false }: { children: ReactNode; bypass?: boolean }) {
  const t = useTheme();
  const { isVerificationPending } = useVerificationStatus();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const userId = useUserStore.getState().user?._id;
      await Promise.allSettled([
        userId ? useUserStore.getState().fetchUser(userId) : Promise.resolve(),
        useBusinessRegistrationStore.getState().loadCurrent(),
      ]);
      if (alive) setChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (bypass) return <>{children}</>;
  if (isVerificationPending) return <VerificationPendingView />;
  if (!checked) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.colors.white }}>
        <ActivityIndicator color={t.colors.primary} />
      </View>
    );
  }
  return <>{children}</>;
}
