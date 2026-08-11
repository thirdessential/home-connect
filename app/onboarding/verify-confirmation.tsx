import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import TerraceHeader from "@/components/auth/TerraceHeader";
import ActionButton from "@/components/inputs/ActionButton";
import { useSocietyStore } from "@/store/useSocietyStore";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyConfirmationScreen() {
  const societyName = useSocietyStore((s) => s.selectedSociety?.name) ?? "your society";

  const handleBrowse = useCallback(() => {
    router.replace("/(tabs)/home");
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TerraceHeader compact />

        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={getWidth(40)} color="#16A34A" />
        </View>

        <Text style={styles.title}>
          Your request to join{" "}
          <Text style={{ color: TERRACE_COLORS.orange }}>{societyName}</Text> has been submitted.
        </Text>
        <Text style={styles.subtitle}>
          {societyName} admins will review your request shortly.
        </Text>

        <ActionButton
          title="Browse Terrace"
          onPress={handleBrowse}
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<Ionicons name="business-outline" size={getWidth(18)} color="#fff" />}
          containerStyle={styles.browseBtn}
        />

        <View style={styles.trackNote}>
          <Ionicons name="person-circle-outline" size={getWidth(18)} color={TERRACE_COLORS.textMuted} />
          <Text style={styles.trackNoteText}>
            Track your verification anytime in Profile → Verification. We&apos;ll notify you once it&apos;s approved.
          </Text>
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
    alignItems: "center",
  },
  checkCircle: {
    width: getWidth(88),
    height: getWidth(88),
    borderRadius: getWidth(44),
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: getHeight(32),
  },
  title: {
    fontSize: getWidth(22),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
    textAlign: "center",
    marginTop: getHeight(20),
    lineHeight: getHeight(30),
  },
  subtitle: {
    fontSize: getWidth(14),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(10),
  },
  browseBtn: {
    marginTop: getHeight(32),
    borderRadius: getWidth(28),
    paddingVertical: getHeight(15),
    width: "100%",
  },
  trackNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: getWidth(8),
    marginTop: getHeight(24),
    paddingHorizontal: getWidth(8),
  },
  trackNoteText: {
    flex: 1,
    fontSize: getWidth(12.5),
    lineHeight: getHeight(18),
    color: TERRACE_COLORS.textMuted,
  },
});
