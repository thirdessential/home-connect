import Heading from "@/components/UI/Heading";
import SuccessModal from "@/components/UI/SuccessModal";
import ServiceForm from "@/components/form/ServiceForm";
import { verificationStatus } from "@/assets/enums/common.enum";
import { usePermissions } from "@/hooks/usePermissions";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { UserRole } from "@/types/roles";
import type { DailyHelper } from "@/types/business.type";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateServiceScreen() {
  const t = useTheme();
  const [successVisible, setSuccessVisible] = useState(false);

  const createService = useDailyHelperStore((s) => s.createDailyHelper);
  const userId = useUserStore((s) => s.user?._id);
  const societyId = useSocietyStore((s) => s.selectedSociety?._id);
  const permissions = usePermissions();

  const goBack = () => router.back();
  const [createdType, setCreatedType] = useState<string>("daily-help");
  // Success must land on the Services Directory (not just Home) with
  // Create/Create-Service fully removed from history — dismissTo pops every
  // screen above the target in one call, same pattern as create-poll.tsx.
  const goToDirectory = () =>
    router.dismissTo({
      pathname: "/(tabs)/directory/all-services",
      params: { type: createdType },
    });

  // Same payload/status logic as the old Services popup (createPostModal.tsx
  // onServiceSubmit) — reused as-is so the existing /api/daily-service/create
  // flow keeps working unchanged.
  const onServiceSubmit = async (serviceFormData: Partial<DailyHelper>) => {
    const payload = {
      ...serviceFormData,
      createdBy: userId!,
      societyIds: societyId ? [societyId] : [],
      verificationStatus: {
        status:
          permissions.hasRole(UserRole.GUEST) ||
          permissions.hasOnly([UserRole.BUSINESS])
            ? verificationStatus.PENDING
            : verificationStatus.APPROVED,
        rejectionReason: null,
      },
    };

    await createService(payload);
    if (!useDailyHelperStore.getState().error) {
      if (societyId) {
        useDailyHelperStore.getState().getAllApprovedDailyServices?.(societyId);
      }
      if (serviceFormData.serviceType) setCreatedType(serviceFormData.serviceType);
      setSuccessVisible(true);
    }
    // On failure: createDailyHelper already sets store `error` and alerts —
    // stay on this page, no redirect (ServiceForm's own error UI is unchanged).
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.white }]} edges={["top", "bottom"]}>
      <View style={styles.headerRow}>
        <Pressable onPress={goBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={t.colors.text} />
        </Pressable>
        <Heading level={3}>Create Service</Heading>
        <Pressable onPress={goBack} hitSlop={12}>
          <Ionicons name="close" size={26} color={t.colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <ServiceForm onSubmit={onServiceSubmit} showStepper={false} />
      </View>

      <SuccessModal
        visible={successVisible}
        onClose={goToDirectory}
        title="Service added"
        subtitle="Your service is available in directory."
        primaryActionLabel="View in Directory"
        onPrimaryAction={goToDirectory}
        centered
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  body: { flex: 1, paddingHorizontal: 20 },
});
