import { Card } from "@/components/UI/Card";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  isSelected?: boolean;
  type?: "pending" | "approved";
  /** Accent color for the icon, value and (when selected) border. */
  color?: string;
  /** Tinted background for the round icon badge. */
  tint?: string;
  /** Small caption under the value. */
  caption?: string;
}

const StatsCard = memo(
  ({
    title,
    value,
    icon,
    onPress,
    isSelected = false,
    type = "approved",
    color,
    tint,
    caption,
  }: StatsCardProps) => {
    const theme = useTheme();

    const accent =
      color ?? (type === "pending" ? "#DC2626" : "#16A34A");
    const badgeTint = tint ?? `${accent}1A`;

    const CardContent = () => (
      <Card
        style={{
          flex: 1,
          flexGrow: 1,
          minWidth: 140,
          backgroundColor: theme.colors.surface,
          borderRadius: 18,
          padding: 16,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? accent : theme.colors.border,
        }}
      >
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: badgeTint }]}>
            <Ionicons name={icon} size={19} color={accent} />
          </View>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>{value}</Text>
        </View>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={2}>
          {title}
        </Text>
        {caption ? (
          <Text
            style={[styles.caption, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {caption}
          </Text>
        ) : null}
      </Card>
    );

    return onPress ? (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <CardContent />
      </TouchableOpacity>
    ) : (
      <CardContent />
    );
  },
);

StatsCard.displayName = "StatsCard";

export default StatsCard;

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, lineHeight: 18, fontWeight: "600", marginTop: 2 },
  value: { fontSize: 26, lineHeight: 30, fontWeight: "800", letterSpacing: -0.5 },
  caption: { fontSize: 12, lineHeight: 16, marginTop: 2 },
});
