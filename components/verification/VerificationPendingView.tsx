import { VERIFICATION_PENDING_MESSAGE, VERIFICATION_PENDING_TITLE } from "@/hooks/useVerificationStatus";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Shown instead of any verification form while a request is pending. */
function VerificationPendingView() {
  const t = useTheme();
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/home");
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.white }]} edges={["top", "bottom"]}>
      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: t.colors.brandWeak }]}>
          <Ionicons name="time-outline" size={36} color={t.colors.brandDark} />
        </View>
        <Text style={[styles.title, { color: t.colors.textPrimary }]}>{VERIFICATION_PENDING_TITLE}</Text>
        <Text style={[styles.message, { color: t.colors.textSecondary }]}>{VERIFICATION_PENDING_MESSAGE}</Text>
        <Pressable
          onPress={goBack}
          style={[styles.btn, { backgroundColor: t.colors.brandDark }]}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default memo(VerificationPendingView);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  badge: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { fontSize: 20, fontFamily: "Manrope_700Bold", marginBottom: 8, textAlign: "center" },
  message: { fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 24 },
  btn: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 32 },
  btnText: { color: "#fff", fontSize: 14.5, fontFamily: "Manrope_700Bold" },
});
