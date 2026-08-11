import { useTheme } from "@/theme/theme";
import { BusinessCategory } from "@/types/business.type";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SelectField from "../form/dropdown";

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedReason?: string) => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDangerous?: boolean; // Red button for dangerous actions
  successTitle?: string; // Title to show on success
  successMessage?: string; // Message to show on success
  autoCloseDelay?: number; // Auto close delay in ms after success (default: 1500)
  onSuccessShown?: () => void; // Called after success state is shown
  dropdownOptions?: BusinessCategory[]; // Optional dropdown options
  dropdownLabel?: string; // Label for the dropdown
  dropdownPlaceholder?: string; // Placeholder for the dropdown
}

export default function ConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  isDangerous = false,
  successTitle = "Success!",
  successMessage = "Action completed successfully",
  autoCloseDelay = 1500,
  onSuccessShown,
  dropdownOptions,
  dropdownLabel = "Select Reason",
  dropdownPlaceholder = "Choose an option",
}: ConfirmationModalProps) {
  const t = useTheme();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(selectedReason || undefined);
      setLoading(false);

      // Show success state
      setShowSuccess(true);

      // Call onSuccessShown callback if provided
      if (onSuccessShown) {
        onSuccessShown();
      }

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, autoCloseDelay);
    } catch (error) {
      setLoading(false);
      setShowSuccess(false);
      console.error("Confirmation action failed:", error);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
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
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: t.colors.background },
          ]}
        >
          {/* Success State */}
          {showSuccess ? (
            <>
              {/* Success Icon */}
              <View style={styles.successIconContainer}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={32} color="#fff" />
                </View>
              </View>

              {/* Success Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: t.colors.textPrimary }]}>
                  {successTitle}
                </Text>
              </View>

              {/* Success Message */}
              <View style={styles.content}>
                <Text
                  style={[styles.message, { color: t.colors.textSecondary }]}
                >
                  {successMessage}
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: t.colors.textPrimary }]}>
                  {title}
                </Text>
              </View>

              {/* Message */}
              <View style={styles.content}>
                <Text
                  style={[styles.message, { color: t.colors.textSecondary }]}
                >
                  {message}
                </Text>
              </View>

              {/* Optional Dropdown */}
              {dropdownOptions && dropdownOptions.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <SelectField
                    label={dropdownLabel}
                    options={dropdownOptions}
                    selectedId={selectedReason}
                    onChange={(id) => setSelectedReason(id)}
                    placeholder={dropdownPlaceholder}
                  />
                </View>
              )}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { borderColor: t.colors.border },
                  ]}
                  onPress={handleClose}
                  disabled={loading || isLoading}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: t.colors.textPrimary },
                    ]}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    {
                      backgroundColor: isDangerous
                        ? "#DC2626"
                        : t.colors.primary,
                      opacity: loading || isLoading ? 0.7 : 1,
                    },
                  ]}
                  onPress={() => {
                    handleConfirm();
                  }}
                  disabled={loading || isLoading}
                >
                  {loading || isLoading ? (
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={20}
                      color="#fff"
                    />
                  ) : (
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
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
    paddingHorizontal: 16,
  },
  modalContainer: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    minWidth: "95%",
    maxWidth: "95%",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    marginBottom: 24,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  successIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
});
