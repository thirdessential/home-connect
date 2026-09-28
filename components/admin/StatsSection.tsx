import StatsCard from "@/components/common/StatsCard";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

export type VerificationStats = {
  pendingRequests: number;
  approvedResidents: number;
  approvedBusinesses: number;
  reportsCount: number;
};

export type StatsLoading = {
  reportsCount?: boolean;
};

export type SelectedStatsCard =
  | "pending"
  | "approved-residents"
  | "approved-business"
  | null;

type Props = {
  stats: VerificationStats;
  selectedCard: SelectedStatsCard;
  onPendingPress: () => void;
  onApprovedResidentsPress: () => void;
  onApprovedBusinessPress: () => void;
  onReportedContentsPress: () => void;
  loadingStats?: StatsLoading;
};

const StatsSection = memo(function StatsSection({
  stats,
  selectedCard,
  onPendingPress,
  onApprovedResidentsPress,
  onApprovedBusinessPress,
  onReportedContentsPress,
  loadingStats,
}: Props) {
  // Uniform 2×2 grid — all 4 cards are the same "item" (48%) size/structure,
  // row 1: Pending Requests / Approved Residents, row 2: Approved Businesses
  // / Reports. No full-width card, so no odd-one-out blank slot.
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <StatsCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon="people-outline"
          caption="Needs your review"
          color="#B9741B"
          tint="#FBEEDD"
          onPress={onPendingPress}
          isSelected={selectedCard === "pending"}
          type="pending"
        />
      </View>
      <View style={styles.item}>
        <StatsCard
          title="Approved Residents"
          value={stats.approvedResidents}
          icon="person-add-outline"
          caption="Total approved"
          color="#1B6E3C"
          tint="#E4F3EA"
          onPress={onApprovedResidentsPress}
          isSelected={selectedCard === "approved-residents"}
          type="approved"
        />
      </View>
      <View style={styles.item}>
        <StatsCard
          title="Approved Businesses"
          value={stats.approvedBusinesses}
          icon="storefront-outline"
          caption="Total approved"
          color="#6E4FE8"
          tint="#EFEBFD"
          onPress={onApprovedBusinessPress}
          isSelected={selectedCard === "approved-business"}
          type="approved"
        />
      </View>
      <View style={styles.item}>
        <StatsCard
          title="Reports"
          value={stats.reportsCount}
          icon="flag"
          caption="Posts, comments, deals, events & more"
          color="#DC2626"
          tint="#FDECEC"
          onPress={onReportedContentsPress}
          type="pending"
          loading={loadingStats?.reportsCount}
        />
      </View>
    </View>
  );
});

export default StatsSection;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    rowGap: 0,
    marginBottom: 8,
  },
  item: { width: "48%" },
});
