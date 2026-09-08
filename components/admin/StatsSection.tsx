import StatsCard from "@/components/common/StatsCard";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

export type VerificationStats = {
  pendingRequests: number;
  approvedResidents: number;
  approvedBusinesses: number;
  approvedServices: number;
  reportedContents: number;
};

export type SelectedStatsCard =
  | "pending"
  | "approved-residents"
  | "approved-business"
  | "approved-services"
  | "reported-contents"
  | null;

type Props = {
  stats: VerificationStats;
  selectedCard: SelectedStatsCard;
  onPendingPress: () => void;
  onApprovedResidentsPress: () => void;
  onApprovedBusinessPress: () => void;
  onApprovedServicesPress: () => void;
  onReportedContentsPress: () => void;
};

const StatsSection = memo(function StatsSection({
  stats,
  selectedCard,
  onPendingPress,
  onApprovedResidentsPress,
  onApprovedBusinessPress,
  onApprovedServicesPress,
  onReportedContentsPress,
}: Props) {
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
          title="Approved Services"
          value={stats.approvedServices}
          icon="people-circle-outline"
          caption="Total approved"
          color="#2F5FE0"
          tint="#EAF0FE"
          onPress={onApprovedServicesPress}
          isSelected={selectedCard === "approved-services"}
          type="approved"
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
    rowGap: 12,
    marginBottom: 8,
  },
  item: { width: "48%" },
  itemFull: { width: "100%" },
});
