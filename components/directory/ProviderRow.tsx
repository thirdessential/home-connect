import VerificationGateModal from "@/components/common/VerificationGateModal";
import { useVerificationGate } from "@/hooks/useVerificationGate";
import { getInitials } from "@/lib/imageUtils";
import { capitalizeWords } from "@/lib/utils";
import { dir, tintFor } from "@/theme/directory";
import { ServiceProvider } from "@/types/common.type";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ProviderRow = memo(function ProviderRow({ provider }: { provider: ServiceProvider }) {
  const router = useRouter();
  const { requireVerified, gate, closeGate } = useVerificationGate();
  const tint = tintFor(provider.category || "");

  const open = useCallback(() => {
    // Block navigation before it happens — no details render/API call.
    if (!requireVerified("page")) return;
    router.push(
      `/(tabs)/directory/${provider.productType === "business" ? "business" : "service"}/${provider.id}`,
    );
  }, [requireVerified, provider.productType, provider.id, router]);

  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.row} onPress={open}>
      <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
        <Text style={[styles.avatarText, { color: tint.fg }]}>{getInitials(provider.name)}</Text>
      </View>
      <View style={styles.mid}>
        <Text style={styles.name} numberOfLines={1}>{provider.name}</Text>
        <View style={styles.meta}>
          <Text style={[styles.tag, { color: tint.tagFg, backgroundColor: tint.tagBg }]} numberOfLines={1}>
            {capitalizeWords(provider.category)}
          </Text>
          <Ionicons name="star" size={13} color={dir.star} />
          <Text style={styles.rating}>{provider.rating}</Text>
          <Text style={styles.count}>({provider.reviewCount})</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.go}
        onPress={open}
        accessibilityLabel={`View profile of ${provider.name}`}
      >
        <Ionicons name="arrow-up-outline" size={18} color={dir.lime} style={{ transform: [{ rotate: "45deg" }] }} />
      </TouchableOpacity>
      <VerificationGateModal visible={gate.visible} mode={gate.mode} onClose={closeGate} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: dir.radius.card, padding: 12, borderWidth: 1, borderColor: dir.rowBorder },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: dir.font.extra, fontSize: 15 },
  mid: { flex: 1, minWidth: 0, gap: 5 },
  name: { fontFamily: dir.font.bold, fontSize: 14.5, color: dir.ink },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  tag: { fontFamily: dir.font.semi, fontSize: 11.5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: "hidden", flexShrink: 1, marginRight: 4 },
  rating: { fontFamily: dir.font.bold, fontSize: 12, color: dir.ink },
  count: { fontFamily: dir.font.medium, fontSize: 12, color: dir.muted },
  go: { width: 44, height: 44, borderRadius: 22, backgroundColor: dir.green, alignItems: "center", justifyContent: "center" },
});

export default ProviderRow;
