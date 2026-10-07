import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
  /** Society name (the dashboard's selected society). */
  societyName?: string | null;
  /** e.g. "29 residents" */
  countLabel?: string;
  /** Omit when the header sits inside the dashboard (no "back" step). */
  onBack?: () => void;
};

/** Header shared by every dashboard drill-down: "← Back to Dashboard", title, society, count. */
const DrillDownHeader = memo(function DrillDownHeader({ title, societyName, countLabel, onBack }: Props) {
  const t = useTheme();
  const accent = t.colors.brandDark ?? t.colors.primary;
  return (
    <View style={styles.wrap}>
      {onBack ? (
      <TouchableOpacity
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back to Dashboard"
        style={styles.back}
      >
        <Ionicons name="arrow-back" size={16} color={accent} />
        <Text style={[styles.backText, { color: accent }]}>Back to Dashboard</Text>
      </TouchableOpacity>
      ) : null}
      <Text style={[t.typography.h5, styles.title, { color: t.colors.textPrimary }]}>{title}</Text>
      {societyName ? (
        <Text style={[styles.sub, { color: t.colors.textSecondary }]} numberOfLines={1}>
          {societyName}
        </Text>
      ) : null}
      {countLabel ? (
        <Text style={[styles.count, { color: t.colors.textSecondary }]}>{countLabel}</Text>
      ) : null}
    </View>
  );
});

export default DrillDownHeader;

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14, alignSelf: "flex-start" },
  backText: { fontSize: 14.5, fontFamily: "Manrope_700Bold" },
  title: { fontSize: 20 },
  sub: { fontSize: 13.5, marginTop: 2 },
  count: { fontSize: 13, marginTop: 2, fontFamily: "Manrope_600SemiBold" },
});
