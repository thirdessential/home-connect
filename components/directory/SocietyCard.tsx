import { useSocietyStore } from "@/store/useSocietyStore";
import { dir } from "@/theme/directory";
import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SocietyCard = memo(function SocietyCard() {
  const society = useSocietyStore((s) => s.selectedSociety);
  const [showDetails, setShowDetails] = useState(false);
  if (!society) return null;

  const stats = [
    { label: "Flats", value: society.totalFlats?.toString() ?? "N/A" },
    { label: "Residents", value: society.totalResidents?.toString() ?? "N/A" },
    { label: "Buildings", value: society.towers?.length?.toString() ?? "N/A" },
  ];
  const cityLine = [society.city, society.state].filter(Boolean).join(", ") +
    (society.pincode ? ` - ${society.pincode}` : "");

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Ionicons name="business-outline" size={16} color={dir.green} />
          </View>
          <Text style={styles.eyebrow}>MY SOCIETY</Text>
        </View>
        <TouchableOpacity
          style={styles.pill}
          onPress={() => setShowDetails((v) => !v)}
          accessibilityLabel={showDetails ? "Hide society details" : "View society details"}
        >
          <Text style={styles.pillText}>{showDetails ? "Hide details" : "View details"}</Text>
          <Ionicons name={showDetails ? "chevron-up" : "chevron-forward"} size={12} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={{ gap: 4 }}>
        <Text style={styles.name}>{society.name}</Text>
        {!!society.completeAddress && <Text style={styles.address}>{society.completeAddress}</Text>}
        {showDetails && !!society.city && <Text style={styles.address}>{cityLine}</Text>}
        {showDetails && !!society.maintenanceCharge && (
          <Text style={styles.address}>Monthly maintenance: ₹ {society.maintenanceCharge}</Text>
        )}
      </View>
      <View style={styles.stats}>
        {stats.map((s, i) => (
          <View key={s.label} style={[styles.stat, i > 0 && styles.divider]}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: dir.green, borderRadius: dir.radius.society, padding: 18, gap: 14 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBox: { width: 28, height: 28, borderRadius: 9, backgroundColor: dir.lime, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontFamily: dir.font.bold, fontSize: 12, letterSpacing: 0.6, color: dir.lime },
  pill: { minHeight: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.14)", flexDirection: "row", alignItems: "center", gap: 4 },
  pillText: { fontFamily: dir.font.semi, fontSize: 12, color: "#fff" },
  name: { fontFamily: dir.font.extra, fontSize: 20, color: "#fff", letterSpacing: -0.2 },
  address: { fontFamily: dir.font.medium, fontSize: 12.5, lineHeight: 18, color: dir.soft },
  stats: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.09)", borderRadius: 18, paddingVertical: 12 },
  stat: { flex: 1, alignItems: "center", gap: 2, marginVertical: 4 },
  divider: { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.18)" },
  statValue: { fontFamily: dir.font.extra, fontSize: 20, color: "#fff" },
  statLabel: { fontFamily: dir.font.medium, fontSize: 11.5, color: dir.soft },
});

export default SocietyCard;
