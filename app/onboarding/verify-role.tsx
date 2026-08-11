import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import TerraceHeader from "@/components/auth/TerraceHeader";
import RoleUsageStep, { UsageRole } from "@/components/onboarding/RoleUsageStep";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyRoleScreen() {
  const [role, setRole] = useState<UsageRole | null>(null);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handleContinue = useCallback(() => {
    if (!role) return;
    router.push({ pathname: "/onboarding/verify-step1", params: { role } });
  }, [role]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TerraceHeader compact onBack={goBack} />

        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={getWidth(28)} color={TERRACE_COLORS.orange} />
        </View>

        <Text style={styles.title}>How will you use Terrace?</Text>
        <Text style={styles.subtitle}>
          We verify every resident and business to keep your community safe and trusted.
        </Text>

        <View style={styles.stepWrap}>
          <RoleUsageStep selected={role} onSelect={setRole} onContinue={handleContinue} />
        </View>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={getWidth(15)} color={TERRACE_COLORS.textMuted} />
          <Text style={styles.footerText}>Safe. Verified. For your community.</Text>
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
  badge: {
    width: getWidth(64),
    height: getWidth(64),
    borderRadius: getWidth(32),
    backgroundColor: TERRACE_COLORS.orangeTint,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: getHeight(20),
  },
  title: {
    fontSize: getWidth(26),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
    textAlign: "center",
    marginTop: getHeight(16),
  },
  subtitle: {
    fontSize: getWidth(15),
    lineHeight: getHeight(22),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(10),
    paddingHorizontal: getWidth(12),
  },
  stepWrap: {
    marginTop: getHeight(28),
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: getHeight(20),
  },
  footerText: {
    fontSize: getWidth(13),
    color: TERRACE_COLORS.textMuted,
    marginLeft: getWidth(8),
  },
});
