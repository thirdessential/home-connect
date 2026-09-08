import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

// Single shared "please verify" prompt — reused for every guest/unverified
// gate (Join Event, Event Details, Directory Details, Create) so there is
// exactly one popup implementation instead of one per screen.
const VerificationGateModal = memo(function VerificationGateModal({
  visible,
  onClose,
  mode = "action",
}: {
  visible: boolean;
  onClose: () => void;
  mode?: "action" | "page";
}) {
  const t = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: t.colors.cardBackground }]}>
          <View style={[styles.iconWrap, { backgroundColor: t.colors.brandWeak }]}>
            <Ionicons name="shield-checkmark-outline" size={26} color={t.colors.brandDark} />
          </View>
          <Text style={[styles.title, { color: t.colors.text }]}>Please verify your account</Text>
          <Text style={[styles.message, { color: t.colors.secondaryText }]}>
            {mode === "page"
              ? "Please verify your account before you can access this page."
              : "Please verify your account before you can use this feature."}
          </Text>

          <Pressable
            style={[styles.cta, { backgroundColor: t.colors.brandDark }]}
            onPress={() => {
              onClose();
              router.push("/onboarding/verify-role");
            }}
          >
            <Text style={styles.ctaText}>Verify Account</Text>
          </Pressable>
          <Pressable onPress={onClose} hitSlop={8} style={styles.dismiss}>
            <Text style={[styles.dismissText, { color: t.colors.secondaryText }]}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

export default VerificationGateModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  message: { fontSize: 13.5, lineHeight: 19, textAlign: "center", marginBottom: 18 },
  cta: { width: "100%", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 14.5, fontWeight: "700" },
  dismiss: { marginTop: 12, paddingVertical: 4 },
  dismissText: { fontSize: 13, fontWeight: "600" },
});
