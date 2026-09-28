import Skeleton from "@/components/UI/Skeleton";
import { memo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const DashboardSkeleton = memo(() => (
  <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
    {/* Header — title + society name row, matches DashboardHeader */}
    <View style={styles.header}>
      <Skeleton width="55%" height={22} borderRadius={6} />
      <Skeleton width="35%" height={14} borderRadius={6} style={styles.headerSub} />
    </View>
    {/* Stats — matches StatsSection's uniform 2×2 grid (Pending/Approved
        Residents, Approved Businesses/Reports) */}
    <View style={styles.stats}>
      <View style={styles.row}>
        <Skeleton width="48%" height={100} borderRadius={18} />
        <Skeleton width="48%" height={100} borderRadius={18} />
      </View>
      <View style={styles.row}>
        <Skeleton width="48%" height={100} borderRadius={18} />
        <Skeleton width="48%" height={100} borderRadius={18} />
      </View>
    </View>
    {/* Pending Requests heading + filter tabs, matches PendingRequestsSection */}
    <View style={styles.list}>
      <Skeleton width="45%" height={20} borderRadius={6} style={styles.listTitle} />
      <View style={styles.tabsRow}>
        <Skeleton width={110} height={32} borderRadius={16} />
        <Skeleton width={90} height={32} borderRadius={16} />
        <Skeleton width={100} height={32} borderRadius={16} />
      </View>
      <View style={styles.tabsRow}>
        <Skeleton width={120} height={32} borderRadius={8} />
        <Skeleton width={90} height={32} borderRadius={8} />
      </View>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} width="100%" height={90} borderRadius={12} />
      ))}
    </View>
    <View style={styles.spacer} />
  </ScrollView>
));

DashboardSkeleton.displayName = "DashboardSkeleton";

export default DashboardSkeleton;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerSub: { marginTop: 8 },
  stats: { paddingHorizontal: 20, gap: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  list: { paddingHorizontal: 16, marginTop: 24, gap: 12 },
  listTitle: { marginBottom: 8 },
  tabsRow: { flexDirection: "row", gap: 8 },
  spacer: { height: 40 },
});
