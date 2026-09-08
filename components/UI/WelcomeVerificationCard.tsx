import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const WelcomeVerificationCard = memo(() => {
  const t = useTheme();

  const handleVerifyPress = useCallback(() => {
    router.push("/onboarding/verify-role");
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: t.colors.cardBackground, borderColor: t.colors.border },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: t.colors.brandWeak }]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={t.colors.brandDark} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: t.colors.text }]} numberOfLines={1}>
          Verification Pending
        </Text>
        <Text style={[styles.description, { color: t.colors.secondaryText }]} numberOfLines={2}>
          Your profile verification is still pending. Complete the required verification to
          unlock all Home Connect features.
        </Text>

        <TouchableOpacity onPress={handleVerifyPress} activeOpacity={0.7} style={styles.ctaRow}>
          <Text style={[styles.ctaText, { color: t.colors.brandDark }]}>Complete Verification</Text>
          <Ionicons name="arrow-forward" size={14} color={t.colors.brandDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

WelcomeVerificationCard.displayName = "WelcomeVerificationCard";

export default WelcomeVerificationCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  body: { flex: 1 },
  title: {
    fontSize: 14.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
