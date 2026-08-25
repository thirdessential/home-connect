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
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 16,
          elevation: 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? accent : "#F0EEE9",
        }}
      >
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: badgeTint }]}>
            <Ionicons name={icon} size={22} color={accent} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.value, { color: accent }]}>{value}</Text>
            {caption ? (
              <Text
                style={[styles.caption, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {caption}
              </Text>
            ) : null}
          </View>
        </View>
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
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1 },
  title: { fontSize: 14, lineHeight: 18, fontWeight: "700", color: "#1F2430" },
  value: { fontSize: 28, lineHeight: 34, fontWeight: "800", marginTop: 2 },
  caption: { fontSize: 12, lineHeight: 16, marginTop: 2 },
});
