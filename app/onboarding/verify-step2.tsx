import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import TerraceHeader from "@/components/auth/TerraceHeader";
import ResidentProofStep, { ResidentProofResult } from "@/components/onboarding/ResidentProofStep";
import { useToast } from "@/components/common/Toast";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { getHeight, getWidth } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyStep2Screen() {
  const { fullName, email, towerId, flatNo } = useLocalSearchParams<{
    role?: string;
    fullName?: string;
    email?: string;
    towerId?: string;
    flatNo?: string;
  }>();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const towerList = useSocietyStore((s) => s.towerList);
  const getTowerById = useSocietyStore((s) => s.getTowerById);
  const submitVerification = useSocietyStore((s) => s.submitVerification);
  const setUser = useUserStore((s) => s.setUser);
  const userId = useUserStore((s) => s.user?._id);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handleContinue = useCallback(
    async (proof: ResidentProofResult) => {
      if (!userId) {
        router.push("/onboarding/verify-confirmation");
        return;
      }
      setSubmitting(true);
      try {
        const towerName = towerId ? getTowerById(towerId, towerList)?.name : undefined;
        const updatedUser = await submitVerification({
          full_name: fullName,
          email: email || undefined,
          tower: towerName,
          flat_no: flatNo,
          ...proof,
        });
        if (updatedUser) setUser(updatedUser);
        router.push("/onboarding/verify-confirmation");
      } catch (err: any) {
        showToast(err?.message || "Failed to submit verification. Please try again.", "error");
      } finally {
        setSubmitting(false);
      }
    },
    [userId, fullName, email, towerId, flatNo, towerList, getTowerById, submitVerification, setUser, showToast],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TerraceHeader compact onBack={goBack} />

        <Text style={styles.title}>Verify your identity</Text>
        <Text style={styles.subtitle}>A few quick steps to help us verify you as a resident.</Text>

        <View style={styles.stepWrap}>
          <ResidentProofStep onContinue={handleContinue} submitting={submitting} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TERRACE_COLORS.screenBg },
  scroll: {
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(12),
    paddingBottom: getHeight(24),
  },
  title: {
    fontSize: getWidth(24),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
    textAlign: "center",
    marginTop: getHeight(20),
  },
  subtitle: {
    fontSize: getWidth(14),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(6),
    marginBottom: getHeight(20),
  },
  stepWrap: { marginBottom: getHeight(12) },
});
