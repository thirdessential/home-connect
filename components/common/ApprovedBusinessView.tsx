import CircularImage from "@/components/form/CircularImage";
import { Card } from "@/components/UI/Card";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FilterSheet from "./FilterSheet";

interface ApprovedBusinessViewProps {
  approvedBusinesses: any[];
}

// Memoized business card item to prevent re-renders
interface BusinessCardProps {
  business: any;
  onPress: (id: string) => void;
  theme: any;
}

const BusinessCardItem = memo(
  ({ business, onPress, theme }: BusinessCardProps) => {
    const handlePress = useCallback(() => {
      onPress(business._id);
    }, [business._id, onPress]);

    return (
      <Card style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Pressable onPress={handlePress}>
          <View style={styles.cardTop}>
            <View style={[styles.logo, { backgroundColor: theme.colors.brandWeak }]}>
              <CircularImage uri={business.image} size={44} mode="view" />
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.headingRow}>
                <Text style={[styles.businessTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {business.title}
                </Text>
                <View style={styles.approvedBadge}>
                  <Text style={styles.approvedText}>Approved</Text>
                </View>
              </View>
              {business.owner || business.ownerName ? (
                <Text style={[styles.secondaryText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  Owner: {business.owner ?? business.ownerName}
                </Text>
              ) : null}
            </View>
          </View>

          {business.category ? (
            <View style={styles.tagsRow}>
              <View style={[styles.categoryChip, { backgroundColor: "#F1EAFE" }]}>
                <Text style={[styles.categoryChipText, { color: "#6E4FE8" }]}>{business.category}</Text>
              </View>
            </View>
          ) : null}

          {(business.tower || business.completeAddress) ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {business.tower ? `Tower ${business.tower}` : business.completeAddress}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <View style={[styles.viewBtn, { borderColor: theme.colors.border }]}>
              <Text style={{ fontSize: 12.5, fontWeight: "700", color: theme.colors.textPrimary }}>View details</Text>
            </View>
          </View>
        </Pressable>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.business._id === nextProps.business._id &&
      prevProps.business.title === nextProps.business.title &&
      prevProps.business.category === nextProps.business.category &&
      prevProps.business.image === nextProps.business.image &&
      prevProps.theme === nextProps.theme &&
      prevProps.onPress === nextProps.onPress
    );
  }
);

BusinessCardItem.displayName = "BusinessCardItem";

const ApprovedBusinessView: React.FC<ApprovedBusinessViewProps> = ({
  approvedBusinesses,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [category, setCategory] = useState("all");
  const [tower, setTower] = useState("all");
  const [draft, setDraft] = useState({ category: "all", tower: "all" });

  const handleBusinessPress = useCallback(
    (businessId: string) => {
      router.navigate(`/(tabs)/profile/user-business-screen?id=${businessId}`);
    },
    [router]
  );

  const categories = useMemo(
    () => Array.from(new Set(approvedBusinesses.map((b) => b.category).filter(Boolean))),
    [approvedBusinesses]
  );
  const towers = useMemo(
    () => Array.from(new Set(approvedBusinesses.map((b) => b.tower).filter(Boolean))),
    [approvedBusinesses]
  );
  const activeFilterCount = (category !== "all" ? 1 : 0) + (tower !== "all" ? 1 : 0);

  const filteredBusinesses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return approvedBusinesses.filter((b) => {
      const matchQ =
        !q ||
        String(b.title ?? "").toLowerCase().includes(q) ||
        String(b.owner ?? b.ownerName ?? "").toLowerCase().includes(q);
      const matchCat = category === "all" || b.category === category;
      const matchTower = tower === "all" || b.tower === tower;
      return matchQ && matchCat && matchTower;
    });
  }, [approvedBusinesses, search, category, tower]);

  const businessList = useMemo(
    () =>
      filteredBusinesses.map((business) => (
        <BusinessCardItem
          key={business._id}
          business={business}
          onPress={handleBusinessPress}
          theme={theme}
        />
      )),
    [filteredBusinesses, handleBusinessPress, theme]
  );

  const openFilter = () => {
    setDraft({ category, tower });
    setFilterVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filtersBar}>
        <View style={[styles.searchField, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Ionicons name="search" size={16} color={theme.colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by business or owner name"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          />
        </View>
        <TouchableOpacity
          onPress={openFilter}
          style={[styles.filterBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
        >
          <Ionicons name="options-outline" size={16} color={theme.colors.textPrimary} />
          <Text style={{ fontSize: 13.5, fontWeight: "600", color: theme.colors.textPrimary }}>Filter</Text>
          {activeFilterCount > 0 ? (
            <View style={[styles.filterBadge, { backgroundColor: theme.colors.brand }]}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* List */}
      {filteredBusinesses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={26} color={theme.colors.textSecondary} />
          <Text style={{ marginTop: 8, fontWeight: "700", color: theme.colors.textPrimary }}>
            No businesses match your filters
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {businessList}
        </ScrollView>
      )}

      <FilterSheet
        visible={filterVisible}
        title="Filter businesses"
        fields={[
          {
            key: "category",
            label: "Category",
            value: draft.category,
            options: [{ label: "All categories", value: "all" }, ...categories.map((c) => ({ label: c, value: c }))],
            onChange: (v) => setDraft((d) => ({ ...d, category: v })),
          },
          {
            key: "tower",
            label: "Tower / Location",
            value: draft.tower,
            options: [{ label: "All towers", value: "all" }, ...towers.map((tw) => ({ label: `Tower ${tw}`, value: tw }))],
            onChange: (v) => setDraft((d) => ({ ...d, tower: v })),
          },
        ]}
        onClose={() => setFilterVisible(false)}
        onClear={() => {
          setCategory("all");
          setTower("all");
          setFilterVisible(false);
        }}
        onApply={() => {
          setCategory(draft.category);
          setTower(draft.tower);
          setFilterVisible(false);
        }}
      />
    </View>
  );
};

export default ApprovedBusinessView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filtersBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
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
  emptyState: { alignItems: "center", paddingVertical: 40 },
  card: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  infoContainer: {
    flex: 1,
  },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  businessTitle: {
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1,
  },
  secondaryText: {
    marginTop: 2,
    fontSize: 13,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  categoryChipText: { fontSize: 12, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  metaText: { fontSize: 12.5, flexShrink: 1 },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  viewBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
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
});
