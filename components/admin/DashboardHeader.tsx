import { useTheme } from "@/theme/theme";
import { Society } from "@/types/society.type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  const t = useTheme();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home"));

  return (
    <View style={[styles.header, { backgroundColor: t.colors.surface, borderBottomColor: t.colors.border }]}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={goBack}
          hitSlop={8}
          style={[styles.iconBtn, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}
        >
          <Ionicons name="arrow-back" size={20} color={t.colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.titleWrap}
          activeOpacity={isSuperAdmin ? 0.7 : 1}
          onPress={isSuperAdmin ? onSocietyPress : undefined}
        >
          <Text style={[styles.title, { color: t.colors.textPrimary }]}>Admin Dashboard</Text>
          <View style={styles.subRow}>
            <Text style={[styles.subtitle, { color: t.colors.textSecondary }]} numberOfLines={1}>
              {isSuperAdmin ? societyName : "Only visible to admins of the app."}
            </Text>
            {isSuperAdmin ? (
              <Ionicons name="chevron-down" size={15} color={t.colors.textSecondary} />
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default DashboardHeader;

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  subtitle: { fontSize: 13.5, flexShrink: 1 },
});
