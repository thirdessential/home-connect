import { ENTITY_TYPE_FILTERS } from "@/assets/mocks/category";
import DetailCard from "@/components/common/DetailCard";
import EmptyState from "@/components/common/EmptyState";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Request = {
  id: string;
  [key: string]: any;
};

type SortOrder = "newest" | "oldest";

type TabCounts = {
  all: number;
  user: number;
  business: number;
  service: number;
};

type Props = {
  requests: Request[];
  allRequestsSelected: boolean;
  isRequestSelected: (id: string) => boolean;
  activeFilter: string;
  counts: TabCounts;
  onFilterChange: (filterId: string) => void;
  onSelectAll: () => void;
  onApprove: (id: string, type: string) => void;
  onReject: (id: string, type: string) => void;
  onSelectionChange: (id: string, isSelected: boolean) => void;
};

const TAB_LABELS: Record<string, string> = {
  all: "All Requests",
  user: "Residents",
  business: "Businesses",
  service: "Services",
};

const EmptyRequests = (
  <EmptyState
    icon="receipt-outline"
    title="No Data Yet"
    subtitle="No Requests available for the selected filter."
  />
);

const PendingRequestsSection = memo(function PendingRequestsSection({
  requests,
  allRequestsSelected,
  isRequestSelected,
  activeFilter,
  counts,
  onFilterChange,
  onSelectAll,
  onApprove,
  onReject,
  onSelectionChange,
}: Props) {
  const t = useTheme();
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "rejected">("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const filteredRequests = useMemo(() => {
    const byStatus =
      statusFilter === "all"
        ? requests
        : statusFilter === "pending"
          ? requests.filter((r) => !r.status || r.status === "pending")
          : requests.filter((r) => r.status === statusFilter);

    // Copy before sorting — `requests` is a prop and must not be mutated.
    // `appliedAtMs` comes from transformDataForDisplay (falls back to createdAt).
    return [...byStatus].sort((a, b) => {
      const aMs = typeof a.appliedAtMs === "number" ? a.appliedAtMs : 0;
      const bMs = typeof b.appliedAtMs === "number" ? b.appliedAtMs : 0;
      return sortOrder === "newest" ? bMs - aMs : aMs - bMs;
    });
  }, [requests, statusFilter, sortOrder]);

  const toggleSortOrder = useCallback(
    () => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest")),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Request }) => (
      <DetailCard
        key={item.id}
        request={item}
        onApprove={onApprove}
        onReject={onReject}
        isSelected={isRequestSelected(item.id)}
        onSelectionChange={onSelectionChange}
      />
    ),
    [onApprove, onReject, isRequestSelected, onSelectionChange],
  );

  const keyExtractor = useCallback((item: Request) => item.id, []);

  return (
    <>
      {/* Header + tabs */}
      <View style={styles.filterContainer}>
        <View style={styles.titleRow}>
          <Text
            style={[t.typography.h2, { color: t.colors.textPrimary }]}
          >
            Pending Requests
          </Text>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{counts.all}</Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          {ENTITY_TYPE_FILTERS.map((opt) => {
            const isActive = activeFilter === opt.id;
            const count = counts[opt.id as keyof TabCounts] ?? 0;
            return (
              <TouchableOpacity
                key={opt.id}
                style={styles.tabItem}
                onPress={() => onFilterChange(opt.id)}
              >
                <View style={styles.tabLabelRow}>
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isActive ? "#166534" : "#6B7280" },
                    ]}
                  >
                    {TAB_LABELS[opt.id] ?? opt.name}
                  </Text>
                  <View
                    style={[
                      styles.tabCountBadge,
                      { backgroundColor: isActive ? "#DCFCE7" : "#F3F4F6" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        { color: isActive ? "#166534" : "#6B7280" },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </View>
                {isActive ? <View style={styles.tabUnderline} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.toolbarRow}>
          <TouchableOpacity style={styles.sortButton} onPress={toggleSortOrder}>
            <Text style={styles.sortButtonText}>
              {sortOrder === "newest" ? "Newest First" : "Oldest First"}
            </Text>
            <Ionicons
              name={sortOrder === "newest" ? "chevron-down" : "chevron-up"}
              size={16}
              color="#374151"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter !== "all" && styles.filterButtonActive]}
            onPress={() => setFilterOpen((v) => !v)}
          >
            <Ionicons name="filter" size={14} color={statusFilter !== "all" ? "#166534" : "#374151"} />
            <Text style={[styles.filterButtonText, statusFilter !== "all" && { color: "#166534" }]}>
              Filter{statusFilter !== "all" ? " (1)" : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {filterOpen ? (
          <View style={styles.filterPanel}>
            {(["all", "pending", "rejected"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
                onPress={() => {
                  setStatusFilter(f);
                  setFilterOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === f && styles.filterChipTextActive,
                  ]}
                >
                  {f === "all" ? "All Status" : f === "pending" ? "New" : "Rejected"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      {/* Request list */}
      <View style={styles.section}>
        {filteredRequests.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text
              style={[
                t.typography.h4,
                styles.sectionTitle,
                { color: t.colors.textPrimary },
              ]}
            >
              Requests
            </Text>
            <TouchableOpacity onPress={onSelectAll}>
              <Text
                style={[
                  t.typography.body,
                  { color: t.colors.primary, fontWeight: "500" },
                ]}
              >
                {allRequestsSelected ? "Clear Selection" : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <FlatList
          data={filteredRequests}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          scrollEnabled={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          ListEmptyComponent={EmptyRequests}
        />
      </View>
    </>
  );
});

export default PendingRequestsSection;

const styles = StyleSheet.create({
  filterContainer: { marginBottom: 12, marginHorizontal: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  pendingBadge: {
    backgroundColor: "#15803D",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  pendingBadgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EEE9",
    marginBottom: 12,
  },
  tabItem: { marginRight: 20, paddingBottom: 10 },
  tabLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tabLabel: { fontSize: 14, fontWeight: "600" },
  tabCountBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  tabCountText: { fontSize: 11, fontWeight: "700" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#166534",
  },
  toolbarRow: { flexDirection: "row", justifyContent: "space-between" },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sortButtonText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterButtonText: { fontSize: 13, fontWeight: "500", color: "#374151" },
  filterButtonActive: { backgroundColor: "#DCFCE7", borderColor: "#166534" },
  filterPanel: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  filterChipActive: { backgroundColor: "#166534", borderColor: "#166534" },
  filterChipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  filterChipTextActive: { color: "#fff" },
  section: { marginBottom: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sectionTitle: { paddingBottom: 14 },
});
