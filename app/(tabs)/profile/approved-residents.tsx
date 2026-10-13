// Dedicated Approved Residents page (tower directory). Opened from the Admin
// Dashboard card; mirrors the Society Reports page structure.
import ScopedPageHeader from "@/components/admin/ScopedPageHeader";
import { groupResidentsByTower } from "@/components/admin/TowerGrid";
import NoDataCard from "@/components/common/NoDataCard";
import Skeleton from "@/components/UI/Skeleton";
import { useApprovedResidentsScope } from "@/hooks/useApprovedResidentsScope";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const countLabel = (n: number) => (n ? `${n} resident${n > 1 ? "s" : ""}` : "No residents yet");

export default function ApprovedResidentsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { societyId, societyName } = useLocalSearchParams<{ societyId?: string; societyName?: string }>();
  const { residents, towers, societyName: name, ready, error, reload } = useApprovedResidentsScope(societyId, societyName);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const byTower = useMemo(() => groupResidentsByTower(residents, towers), [residents, towers]);
  const q = query.trim().toLowerCase();

  const open = (towerId: string, title: string) => {
    router.push({ pathname: "/profile/approved-residents-list", params: { societyId, societyName: name ?? "", towerId, towerName: title } });
  };

  const row = (key: string, title: string, n: number, onPress: () => void) => (
    <TouchableOpacity
      key={key}
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.row, { borderBottomColor: t.colors.border }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: t.colors.surface }]}>
        <Ionicons name="business-outline" size={20} color={t.colors.brandDark ?? t.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: t.colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: t.colors.textSecondary }]}>{countLabel(n)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
    </TouchableOpacity>
  );

  const visibleTowers = towers.filter((tw) => !q || `tower ${tw.name}`.toLowerCase().includes(q));
  const showAll = !q || "all towers".includes(q);

  return (
    <View style={[styles.container, { backgroundColor: t.colors.white, paddingTop: insets.top }]}>
      <ScopedPageHeader
        title="Approved Residents"
        subtitle={name}
        onBack={() => router.back()}
        onSearchToggle={() => { setSearching((s) => !s); setQuery(""); }}
        searching={searching}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search towers"
      />
      {!ready ? (
        <View style={styles.skeletons}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={64} borderRadius={12} style={{ marginBottom: 12 }} />)}
        </View>
      ) : error && residents.length === 0 && towers.length === 0 ? (
        <NoDataCard iconName="alert-circle-outline" message="Couldn't load towers" subText="Pull down to refresh and try again." />
      ) : towers.length === 0 ? (
        <NoDataCard iconName="business-outline" message="No towers found" subText="No towers are configured for this society yet." />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }}
            />
          }
        >
          <Text style={[t.typography.h5, { color: t.colors.textPrimary, fontSize: 19, marginVertical: 12 }]}>Towers</Text>
          {showAll && row("all", "All Towers", residents.length, () => open("all", "All Towers"))}
          {visibleTowers.map((tw) =>
            row(tw._id, `Tower ${tw.name}`, byTower.get(tw._id)?.length ?? 0, () => open(tw._id, `Tower ${tw.name}`)),
          )}
          {!showAll && visibleTowers.length === 0 ? (
            <Text style={{ color: t.colors.textSecondary, textAlign: "center", marginTop: 24 }}>No matching towers</Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skeletons: { paddingHorizontal: 16, paddingTop: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 16, fontFamily: "Manrope_700Bold" },
  rowSub: { fontSize: 13, marginTop: 2 },
});
