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
      <View style={styles.itemFull}>
        <StatsCard
          title="Reported Contents"
          value={stats.reportedContents}
          icon="alert-circle-outline"
          onPress={onReportedContentsPress}
          isSelected={selectedCard === "reported-contents"}
          type="pending"
        />
      </View>
      <View style={styles.item}>
        <StatsCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon="alert-circle-outline"
          onPress={onPendingPress}
          isSelected={selectedCard === "pending"}
          type="pending"
        />
      </View>
      <View style={styles.item}>
        <StatsCard
          title="Approved Residents"
          value={stats.approvedResidents}
          icon="people-outline"
          onPress={onApprovedResidentsPress}
          isSelected={selectedCard === "approved-residents"}
          type="approved"
        />
      </View>
      <View style={styles.item}>
        <StatsCard
          title="Approved Business"
          value={stats.approvedBusinesses}
          icon="business-outline"
          onPress={onApprovedBusinessPress}
          isSelected={selectedCard === "approved-business"}
          type="approved"
        />
      </View>
      <View style={styles.item}>
        <StatsCard
          title="Approved Services"
          value={stats.approvedServices}
          icon="business-outline"
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
  },
  item: { width: "48%" },
  itemFull: { width: "100%" },
});
