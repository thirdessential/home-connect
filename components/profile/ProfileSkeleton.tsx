import Skeleton from "@/components/UI/Skeleton";
import { StyleSheet, View } from "react-native";

const AVATAR_SIZE = 96;

export default function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} />
        <Skeleton width={180} height={24} borderRadius={8} />
      </View>

      <View style={styles.infoSection}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.infoRow}>
            <Skeleton width={40} height={40} borderRadius={10} />
            <View style={styles.infoText}>
              <Skeleton width={60} height={12} borderRadius={4} />
              <Skeleton width={120} height={16} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.feedSection}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.feedCard}>
            <View style={styles.feedHeader}>
              <Skeleton width={40} height={40} borderRadius={20} />
              <View style={styles.feedHeaderText}>
                <Skeleton width={100} height={14} borderRadius={4} />
                <Skeleton width={60} height={10} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
            </View>
            <Skeleton width="100%" height={100} borderRadius={8} style={{ marginTop: 12 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  top: { alignItems: "center", gap: 12, paddingTop: 8 },
  infoSection: { marginTop: 24, gap: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoText: { flex: 1 },
  feedSection: { marginTop: 28, gap: 16 },
  feedCard: { gap: 4 },
  feedHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  feedHeaderText: { flex: 1 },
});
