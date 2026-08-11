import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TextArea from "../inputs/TextArea";

interface RejectModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  title?: string;
  isLoading?: boolean;
}

export default function RejectModal({
  visible,
  onClose,
  onSubmit,
  title = "Rejection Reason",
  isLoading = false,
}: RejectModalProps) {
  const t = useTheme();
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason.trim());
      setReason("");
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: t.colors.textPrimary }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={t.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* TextArea */}
          <View style={styles.content}>
            <TextArea
              label="Rejection Reason"
              placeholder="Enter rejection reason..."
              value={reason}
              onChangeText={setReason}
              lines={4}
              disabled={isLoading}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: reason.trim() ? "#DC2626" : "#E5E7EB",
              },
            ]}
            onPress={handleSubmit}
            disabled={!reason.trim() || isLoading}
          >
            <Text
              style={[
                styles.submitButtonText,
                {
                  color: reason.trim() ? "#FFFFFF" : "#9CA3AF",
                },
              ]}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    marginBottom: 20,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
