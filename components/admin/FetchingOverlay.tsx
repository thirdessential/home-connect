import { memo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const FetchingOverlay = memo(function FetchingOverlay() {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Loading society data…</Text>
      </View>
    </View>
  );
});

export default FetchingOverlay;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 14,
  },
  text: { fontSize: 14, color: "#6B7280" },
});
