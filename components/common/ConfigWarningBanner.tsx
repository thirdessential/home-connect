import { getHeight } from "@/theme/theme";
import { useConfigWarningStore } from "@/store/useConfigWarningStore";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Renders the app's current startup config warning (e.g. an invalid
 * EXPO_PUBLIC_MY_TERRACE_APP_BACKEND) as a dismissible banner above the
 * Bottom Tab Navigation. Message is entirely driven by useConfigWarningStore —
 * nothing here is hard-coded, so it stays blank when there's no warning.
 */
export default function ConfigWarningBanner() {
  const insets = useSafeAreaInsets();
  const message = useConfigWarningStore((s) => s.message);
  const clearWarning = useConfigWarningStore((s) => s.clearWarning);

  if (!message) return null;

  return (
    <View
      style={[
        styles.banner,
        // Same safe-area convention as Toast.tsx — clears the bottom tab bar
        // and the iOS home indicator / Android gesture bar on both platforms.
        { bottom: insets.bottom + getHeight(70) },
      ]}
    >
      <Ionicons name="warning" size={18} color="#fff" style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
      <Pressable onPress={clearWarning} hitSlop={10} style={styles.closeBtn}>
        <Ionicons name="close" size={16} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 0,
    right: 0,
    minHeight: 30,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    // Explicit solid background (not theme-driven) so white text stays
    // readable in both light and dark mode — same pattern InternetStatusStrip
    // and Toast already use for their status colors.
    backgroundColor: "#B45309",
    zIndex: 10000,
    elevation: 20,
    overflow: "visible",
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    flex: 1,
    flexShrink: 1,
    flexWrap: "wrap",
    color: "#fff",
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "Manrope_700Bold",
  },
  closeBtn: {
    flexShrink: 0,
    marginLeft: 4,
  },
});
