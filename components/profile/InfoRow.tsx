import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  iconColor?: string;
}

const InfoRow = memo(function InfoRow({
  icon,
  label,
  value,
  iconColor,
}: InfoRowProps) {
  const t = useTheme();
  return (
    <View style={styles.infoRow}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: t.colors.lightBackground },
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor ?? t.colors.primary} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={[styles.infoLabel, { color: t.colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: t.colors.textPrimary }]}>
          {value}
        </Text>
      </View>
    </View>
  );
});

export default InfoRow;

const styles = StyleSheet.create({
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: "500", marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "600" },
});
