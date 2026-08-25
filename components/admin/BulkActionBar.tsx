import { useTheme } from "@/theme/theme";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  selectedCount: number;
  onBulkReject: () => void;
  onBulkApprove: () => void;
  // Batches run item-by-item (no bulk endpoint), so the bar locks while one
  // is in flight to stop a second tap firing duplicate approvals.
  isBusy?: boolean;
};

const BulkActionBar = memo(function BulkActionBar({
  selectedCount,
  onBulkReject,
  onBulkApprove,
  isBusy = false,
}: Props) {
  const t = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          t.typography.body,
          { color: t.colors.textSecondary, fontWeight: "500" },
        ]}
      >
        {selectedCount} Selected
      </Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton, isBusy && styles.disabled]}
          onPress={onBulkReject}
          disabled={isBusy}
        >
          <Text
            style={[t.typography.button1, { color: t.colors.textSecondary }]}
          >
            Reject
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.approveButton, isBusy && styles.disabled]}
          onPress={onBulkApprove}
          disabled={isBusy}
        >
          <Text style={[t.typography.button1, { color: "#fff" }]}>
            {isBusy ? "Working…" : "Approve"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default BulkActionBar;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  buttons: { flexDirection: "row", gap: 4 },
  button: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  rejectButton: { backgroundColor: "#F5F5F5" },
  approveButton: { backgroundColor: "#FF6B35" },
  disabled: { opacity: 0.5 },
});
