import Skeleton from "@/components/UI/Skeleton";
import { StyleSheet, View } from "react-native";

const HEADER_HEIGHT = 200;
const AVATAR_SIZE = 100;

export default function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      {/* Top navigation */}
      <View style={styles.topNav}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* Gradient card */}
      <Skeleton width="100%" height={HEADER_HEIGHT} borderRadius={20} />

      {/* Avatar row */}
      <View style={styles.avatarRow}>
        <Skeleton
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          borderRadius={AVATAR_SIZE / 2}
        />
        <View style={styles.actionButtons}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <Skeleton width={44} height={44} borderRadius={22} />
        </View>
      </View>

      {/* Name */}
      <View style={styles.nameRow}>
        <Skeleton width={180} height={24} borderRadius={8} />
      </View>

      {/* Info rows */}
      <View style={styles.infoSection}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.infoRow}>
            <Skeleton width={40} height={40} borderRadius={10} />
            <View style={styles.infoText}>
              <Skeleton width={60} height={12} borderRadius={4} />
              <Skeleton
                width={120}
                height={16}
                borderRadius={4}
                style={{ marginTop: 4 }}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Feed cards */}
      <View style={styles.feedSection}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.feedCard}>
            <View style={styles.feedHeader}>
              <Skeleton width={40} height={40} borderRadius={20} />
              <View style={styles.feedHeaderText}>
                <Skeleton width={100} height={14} borderRadius={4} />
                <Skeleton
                  width={60}
                  height={10}
                  borderRadius={4}
                  style={{ marginTop: 4 }}
                />
              </View>
            </View>
            <Skeleton
              width="100%"
              height={100}
              borderRadius={8}
              style={{ marginTop: 12 }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginTop: -AVATAR_SIZE / 2,
  },
  actionButtons: { flexDirection: "row", gap: 12 },
  nameRow: { marginTop: AVATAR_SIZE / 2 + 16 },
  infoSection: { marginTop: 24, gap: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoText: { flex: 1 },
  feedSection: { marginTop: 32, gap: 16 },
  feedCard: { padding: 16, backgroundColor: "#FFFFFF", borderRadius: 12 },
  feedHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  feedHeaderText: { flex: 1 },
});
