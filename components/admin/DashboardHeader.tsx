import { Society } from "@/types/society.type";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  isSuperAdmin: boolean;
  selectedSociety: Society | null;
  onSocietyPress: () => void;
};

const DashboardHeader = memo(function DashboardHeader({
  isSuperAdmin,
  selectedSociety,
  onSocietyPress,
}: Props) {
  const societyName = selectedSociety?.name ?? "Select Society";

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <Ionicons name="menu" size={26} color="#1F2430" style={styles.menu} />

        <TouchableOpacity
          style={styles.titleWrap}
          activeOpacity={isSuperAdmin ? 0.7 : 1}
          onPress={isSuperAdmin ? onSocietyPress : undefined}
        >
          <Text style={styles.title}>Admin Dashboard</Text>
          <View style={styles.subRow}>
            <Text style={styles.subtitle} numberOfLines={1}>
              {isSuperAdmin ? societyName : "Only visible to admins of the app."}
            </Text>
            {isSuperAdmin ? (
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <View style={styles.bellWrap}>
            <Ionicons name="notifications-outline" size={24} color="#1F2430" />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>5</Text>
            </View>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(societyName?.[0] ?? "A").toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

export default DashboardHeader;

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  row: { flexDirection: "row", alignItems: "center" },
  menu: { marginRight: 12 },
  titleWrap: { flex: 1 },
  title: { fontSize: 22, fontWeight: "800", color: "#1F2430" },
  subRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  subtitle: { fontSize: 14, color: "#6B7280", flexShrink: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 14 },
  bellWrap: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  bellBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#166534",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
