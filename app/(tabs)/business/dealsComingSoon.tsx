import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Placeholder shown on the Deals tab until the feature ships. */
export default function DealsComingSoon() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: t.colors.white, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: t.colors.brandWeak }]}>
        <Ionicons name="pricetag-outline" size={t.iconSizes.xl} color={t.colors.brand} />
      </View>
      <Text style={[t.typography.h1, styles.title, { color: t.colors.textPrimary }]}>
        Coming Soon
      </Text>
      <Text style={[t.typography.body, styles.line, { color: t.colors.textSecondary }]}>
        Deals are coming soon to Home Connect.
      </Text>
      <Text style={[t.typography.body, styles.line, { color: t.colors.textSecondary }]}>
        We&apos;re working on something exciting. Stay tuned!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
  },
  line: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 4,
  },
});
