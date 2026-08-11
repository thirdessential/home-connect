import { ENTITY_TYPE_FILTERS } from "@/assets/mocks/category";
import DetailCard from "@/components/common/DetailCard";
import EmptyState from "@/components/common/EmptyState";
import FilterChips from "@/components/common/FilterChips";
import { useTheme } from "@/theme/theme";
import { memo, useCallback } from "react";
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

type Props = {
  requests: Request[];
  allRequestsSelected: boolean;
  isRequestSelected: (id: string) => boolean;
  onFilterChange: (filterId: string) => void;
  onSelectAll: () => void;
  onApprove: (id: string, type: string) => void;
  onReject: (id: string, type: string) => void;
  onSelectionChange: (id: string, isSelected: boolean) => void;
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
  onFilterChange,
  onSelectAll,
  onApprove,
  onReject,
  onSelectionChange,
}: Props) {
  const t = useTheme();

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
      {/* Filter */}
      <View style={styles.filterContainer}>
        <Text
          style={[
            t.typography.h2,
            styles.sectionTitle,
            { color: t.colors.textPrimary },
          ]}
        >
          Pending Request
        </Text>
        <FilterChips
          options={ENTITY_TYPE_FILTERS}
          onChange={onFilterChange}
          horizontal
          initialValue="all"
        />
      </View>

      {/* Request list */}
      <View style={styles.section}>
        {requests.length > 0 && (
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
          data={requests}
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
  filterContainer: { marginBottom: 4, marginHorizontal: 16 },
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
