import Skeleton from "@/components/UI/Skeleton";
import { memo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const DashboardSkeleton = memo(() => (
  <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
    {/* Header */}
    <View style={styles.header}>
      <Skeleton width="50%" height={28} borderRadius={6} />
    </View>
    {/* Stats — 1 full + 2×2 grid */}
    <View style={styles.stats}>
      <Skeleton width="100%" height={80} borderRadius={12} />
      <View style={styles.row}>
        <Skeleton width="48%" height={80} borderRadius={12} />
        <Skeleton width="48%" height={80} borderRadius={12} />
      </View>
      <View style={styles.row}>
        <Skeleton width="48%" height={80} borderRadius={12} />
        <Skeleton width="48%" height={80} borderRadius={12} />
      </View>
    </View>
    {/* Pending list items */}
    <View style={styles.list}>
      <Skeleton
        width="40%"
        height={20}
        borderRadius={6}
        style={styles.listTitle}
      />
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
  stats: { paddingHorizontal: 20, gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  list: { paddingHorizontal: 16, marginTop: 24, gap: 12 },
  listTitle: { marginBottom: 8 },
  spacer: { height: 40 },
});
