// Residents of one tower (or all towers) of the selected society, with search
// limited to that scope.
import ScopedPageHeader from "@/components/admin/ScopedPageHeader";
import { belongsToTower } from "@/components/admin/TowerGrid";
import FlatGroupedResidents, { residentTypeLabel } from "@/components/common/FlatGroupedResidents";
import NoDataCard from "@/components/common/NoDataCard";
import Skeleton from "@/components/UI/Skeleton";
import { useApprovedResidentsScope } from "@/hooks/useApprovedResidentsScope";
import { useTheme } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ApprovedResidentsListScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { societyId, societyName, towerId, towerName } = useLocalSearchParams<{
    societyId?: string; societyName?: string; towerId?: string; towerName?: string;
  }>();
  const { residents, towers, societyName: name, ready, error, reload } = useApprovedResidentsScope(societyId, societyName);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const isAll = !towerId || towerId === "all";
  const tower = isAll ? null : towers.find((tw) => tw._id === towerId) ?? null;

  const scoped = useMemo(
    () => (isAll ? residents : tower ? residents.filter((u) => belongsToTower(u, tower)) : []),
    [residents, tower, isAll],
  );

  // Only non-sensitive fields are searched: name, flat, resident type, profession, tower.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((u: any) =>
      [u.fullName, u.flatNo, `flat ${u.flatNo}`, residentTypeLabel(u), u.profession ?? u.occupation, isAll ? towers.find((tw) => belongsToTower(u, tw))?.name : null]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [scoped, query, isAll, towers]);

  const title = isAll ? "All Towers" : (towerName as string) || `Tower ${tower?.name ?? ""}`.trim();
  const searchActive = query.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.white, paddingTop: insets.top }}>
      <ScopedPageHeader
        title={title}
        subtitle={name}
        onBack={() => router.back()}
        onSearchToggle={() => { setSearching((s) => !s); setQuery(""); }}
        searching={searching}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder={isAll ? "Search name, flat, type or tower" : "Search name, flat or type"}
      />
      {!ready ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} height={84} borderRadius={12} style={{ marginBottom: 12 }} />)}
        </View>
      ) : error && residents.length === 0 ? (
        <NoDataCard iconName="alert-circle-outline" message="Couldn't load residents" subText="Pull down to refresh and try again." />
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }}
            />
          }
        >
          <FlatGroupedResidents
            residents={results}
            towerList={towers}
            showTower={isAll}
            emptyTitle={searchActive ? "No residents found" : "No residents yet"}
            emptySubtitle={searchActive ? "No residents match your search." : isAll ? "There are no approved residents in this society." : "There are no approved residents in this tower."}
          />
        </ScrollView>
      )}
    </View>
  );
}
