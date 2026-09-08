import { SERVICE_TYPE_OPTIONS } from "@/assets/mocks/category";
import FilterChips from "@/components/common/FilterChips";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Card } from "../UI/Card";
import CircularImage from "../form/CircularImage";
import FilterSheet from "./FilterSheet";
import NoDataCard from "./NoDataCard";

interface ApprovedDailyServicesViewProps {
  approvedServices: any[];
}

const ApprovedDailyServicesView: React.FC<ApprovedDailyServicesViewProps> = ({
  approvedServices,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>(
    SERVICE_TYPE_OPTIONS[0].id,
  );
  const [search, setSearch] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [towerFilter, setTowerFilter] = useState("all");
  const [draftTower, setDraftTower] = useState("all");

  // When filter changes, update selectedFilter
  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
  };

  const towers = useMemo(
    () => Array.from(new Set((approvedServices || []).map((s) => s.tower).filter(Boolean))),
    [approvedServices],
  );

  // Filter services based on selectedFilter + search + tower
  const filteredServices = useMemo(() => {
    if (!approvedServices || approvedServices.length === 0) return [];
    const q = search.trim().toLowerCase();
    return approvedServices.filter((service) => {
      const matchType = service.serviceType === selectedFilter;
      const matchQ = !q || String(service.name ?? "").toLowerCase().includes(q);
      const matchTower = towerFilter === "all" || service.tower === towerFilter;
      return matchType && matchQ && matchTower;
    });
  }, [approvedServices, selectedFilter, search, towerFilter]);

  const handleCardPress = useCallback(
    (providerId: string) => {
      router.navigate(`/(tabs)/directory/service/${providerId}`);
    },
    [router],
  );

  const renderRequestItem = useCallback(
    ({ item }: { item: any }) => (
      <Card style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleCardPress(item?._id)}
        >
          <View style={styles.rowCenter}>
            <View style={[styles.logo, { backgroundColor: theme.colors.brandWeak }]}>
              <CircularImage uri={item.images?.[0]} size={44} mode="view" />
            </View>
            <View style={styles.flex1}>
              <View style={styles.headingRow}>
                <Text style={[styles.nameText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.approvedBadge}>
                  <Text style={styles.approvedText}>Approved</Text>
                </View>
              </View>
              {item.tower ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={12} color={theme.colors.textSecondary} />
                  <Text style={[styles.categoryText, { color: theme.colors.textSecondary }]}>
                    Tower {item.tower}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          {item.categoryId ? (
            <View style={styles.tagsRow}>
              <View style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{item.categoryId}</Text>
              </View>
            </View>
          ) : null}
          <View style={styles.ratingStarsRow}>
            <Ionicons name="star" size={12} color="#facc15" />
            <Text style={styles.ratingValue}>{item.averageRating || 0}</Text>
            <Text style={styles.ratingCountText}>
              ({item.reviews?.length ?? 0}) reviews
            </Text>
          </View>
        </TouchableOpacity>
      </Card>
    ),
    [theme, handleCardPress],
  );

  return (
    <View style={styles.flex1}>
    <ScrollView
        style={[styles.flex1, { backgroundColor: theme.colors.white }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Filters */}
      <View style={styles.serviceSection}>
        <View style={styles.filtersBar}>
          <View style={[styles.searchField, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Ionicons name="search" size={16} color={theme.colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by service or provider name"
              placeholderTextColor={theme.colors.textSecondary}
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setDraftTower(towerFilter);
              setFilterVisible(true);
            }}
            style={[styles.filterBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          >
            <Ionicons name="options-outline" size={16} color={theme.colors.textPrimary} />
            <Text style={{ fontSize: 13.5, fontWeight: "600", color: theme.colors.textPrimary }}>Filter</Text>
            {towerFilter !== "all" ? (
              <View style={[styles.filterBadge, { backgroundColor: theme.colors.brand }]}>
                <Text style={styles.filterBadgeText}>1</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <FilterChips
          options={SERVICE_TYPE_OPTIONS}
          initialValue={selectedFilter}
          onChange={handleFilterChange}
          horizontal
          style={styles.filterContainer}
        />
        {filteredServices.length === 0 ? (
          <NoDataCard
            iconName="reader-outline"
            message="No Results Found"
            subText="You have not added any products to your catalogue yet."
          />
        ) : (
          filteredServices.map((item) => (
            <View key={item?._id || item?.id}>
              {renderRequestItem({ item })}
            </View>
          ))
        )}
      </View>
    </ScrollView>
      <FilterSheet
        visible={filterVisible}
        title="Filter services"
        fields={[
          {
            key: "tower",
            label: "Tower / Location",
            value: draftTower,
            options: [{ label: "All towers", value: "all" }, ...towers.map((tw) => ({ label: `Tower ${tw}`, value: tw }))],
            onChange: setDraftTower,
          },
        ]}
        onClose={() => setFilterVisible(false)}
        onClear={() => {
          setTowerFilter("all");
          setFilterVisible(false);
        }}
        onApply={() => {
          setTowerFilter(draftTower);
          setFilterVisible(false);
        }}
      />
    </View>
  );
};

export default ApprovedDailyServicesView;

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  serviceSection: {},
  filtersBar: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 13.5 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 40,
  },
  filterBadge: {
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 12,
  },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#EAF0FE" },
  categoryChipText: { fontSize: 12, fontWeight: "600", color: "#2F5FE0" },
  approvedBadge: {
    backgroundColor: "#E4F3EA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  approvedText: {
    color: "#1B6E3C",
    fontWeight: "700",
    fontSize: 11,
  },
  filterContainer: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
  card: {
    marginBottom: 12,
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    marginRight: 12,
  },
  nameText: {
    fontWeight: "600",
    fontSize: 16,
  },
  categoryText: {
    marginTop: 4,
    fontSize: 14,
  },
  ratingStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 12,
    marginBottom: 0,
  },
  ratingValue: {
    marginLeft: 4,
    fontWeight: "600",
    fontSize: 12,
    color: "#374151",
  },
  ratingCountText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#9CA3AF",
  },
});
