import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import ActionButton from "@/components/inputs/ActionButton";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type RegistrationConfirmModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirmAndPay: (
    participantCount?: number,
    totalPrice?: number,
  ) => void | Promise<void>;
  onWithdraw?: () => void; // Optional withdrawal callback
  eventTitle: string;
  price: number;
  maxParticipants?: number;
  initialParticipants?: number;
  pricePerParticipant?: boolean;
  currency?: string;
  buttonText?: string;
  showWithdrawButton?: boolean; // Optional flag to show withdrawal button
  withdrawButtonText?: string; // Customizable withdrawal button text
  successTitle?: string; // Title to show on success
  successMessage?: ReactNode; // Message to show on success
  autoCloseDelay?: number; // Auto close delay in ms after success (default: 1500)
  onSuccessShown?: () => void; // Called after success state is shown
  errorTitle?: string; // Title to show on error
  errorMessage?: string; // Message to show on error
  withdrawSuccessTitle?: string; // Title to show after successful withdrawal
  withdrawSuccessMessage?: ReactNode; // Message to show after successful withdrawal
};

export default function RegistrationConfirmModal({
  visible,
  onClose,
  onConfirmAndPay,
  onWithdraw,
  eventTitle,
  price,
  maxParticipants = 1,
  initialParticipants = 1,
  pricePerParticipant = false,
  currency = COMMON_CONSTANTS.CURRENCY,
  buttonText = "Confirm & Pay",
  showWithdrawButton = false,
  withdrawButtonText = "Withdraw Registration",
  successTitle = "Success!",
  successMessage = "Registration confirmed successfully",
  autoCloseDelay = 1500,
  onSuccessShown,
  errorTitle = "Registration Failed",
  errorMessage = "Something went wrong. Please try again.",
  withdrawSuccessTitle = "Registration Withdrawn",
  withdrawSuccessMessage = "You have successfully withdrawn from this event.",
}: RegistrationConfirmModalProps) {
  const t = useTheme();
  const [selectedParticipants, setSelectedParticipants] =
    useState(initialParticipants);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWithdrawSuccess, setShowWithdrawSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // Calculate total price
  const totalPrice =
    selectedParticipants && pricePerParticipant
      ? price * selectedParticipants
      : price;

  const handleConfirm = async () => {
    setLoading(true);
    setShowError(false);
    try {
      await onConfirmAndPay(selectedParticipants, totalPrice);
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
      setShowError(true);
      console.error("Registration failed:", error);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setShowWithdrawSuccess(false);
    setShowError(false);
    onClose();
  };

  const handleRetry = () => {
    setShowError(false);
  };

  const handleWithdraw = async () => {
    if (!onWithdraw) return;
    try {
      await onWithdraw();
    } catch {
      // withdrawal handled externally
    }
    setShowWithdrawSuccess(true);
    setTimeout(() => {
      setShowWithdrawSuccess(false);
      onClose();
    }, autoCloseDelay);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Close modal"
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: t.colors.background },
          ]}
          onStartShouldSetResponder={() => true}
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
              <Text style={[styles.title, { color: t.colors.textPrimary }]}>
                {successTitle}
              </Text>

              {/* Success Message */}
              <View style={styles.successMessageContainer}>
                {typeof successMessage === "string" ? (
                  <Text
                    style={[
                      styles.successMessage,
                      { color: t.colors.textSecondary },
                    ]}
                  >
                    {successMessage}
                  </Text>
                ) : (
                  successMessage
                )}
              </View>
            </>
          ) : showWithdrawSuccess ? (
            <>
              {/* Withdraw Success Icon */}
              <View style={styles.successIconContainer}>
                <View style={styles.withdrawIconCircle}>
                  <Ionicons name="sad-outline" size={32} color="#fff" />
                </View>
              </View>

              {/* Withdraw Success Header */}
              <Text style={[styles.title, { color: t.colors.textPrimary }]}>
                {withdrawSuccessTitle}
              </Text>

              {/* Withdraw Success Message */}
              <View style={styles.successMessageContainer}>
                {typeof withdrawSuccessMessage === "string" ? (
                  <Text
                    style={[
                      styles.successMessage,
                      { color: t.colors.textSecondary },
                    ]}
                  >
                    {withdrawSuccessMessage}
                  </Text>
                ) : (
                  withdrawSuccessMessage
                )}
              </View>
            </>
          ) : showError ? (
            <>
              {/* Error Icon */}
              <View style={styles.successIconContainer}>
                <View style={styles.errorIconCircle}>
                  <Ionicons name="close" size={32} color="#fff" />
                </View>
              </View>

              {/* Error Header */}
              <Text style={[styles.title, { color: t.colors.textPrimary }]}>
                {errorTitle}
              </Text>

              {/* Error Message */}
              <View style={styles.successMessageContainer}>
                <Text
                  style={[
                    styles.successMessage,
                    { color: t.colors.textSecondary },
                  ]}
                >
                  {errorMessage}
                </Text>
              </View>

              {/* Retry Button */}
              <ActionButton
                title="Try Again"
                onPress={handleRetry}
                fullWidth
                containerStyle={{ marginBottom: 12 }}
              />

              {/* Close Button */}
              <ActionButton
                title="Close"
                onPress={handleClose}
                variant="outline"
                fullWidth
              />
            </>
          ) : (
            <>
              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={t.colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Header */}
              <Text style={[styles.title, { color: t.colors.textPrimary }]}>
                Confirm Registration
              </Text>

              {/* Event info */}
              <View style={styles.eventInfo}>
                <Text
                  style={[styles.subtitle, { color: t.colors.textSecondary }]}
                >
                  You are registering for:
                </Text>
                <Text
                  style={[styles.eventTitle, { color: t.colors.textPrimary }]}
                >
                  {eventTitle}
                </Text>
              </View>

              {/* Participant Chooser - Only show if maxParticipants > 1 */}
              {maxParticipants && maxParticipants > 1 && (
                <View style={styles.participantContainer}>
                  <Text
                    style={[
                      styles.participantLabel,
                      { color: t.colors.textPrimary },
                    ]}
                  >
                    Number of Participants
                  </Text>
                  <View style={styles.participantChooser}>
                    <TouchableOpacity
                      style={[
                        styles.participantButton,
                        {
                          backgroundColor: t.colors.primary,
                        },
                      ]}
                      onPress={() =>
                        setSelectedParticipants(
                          Math.max(1, selectedParticipants - 1),
                        )
                      }
                      disabled={selectedParticipants === 1}
                    >
                      <Text
                        style={[
                          styles.participantButtonText,
                          {
                            color: "#FFFFFF",
                          },
                        ]}
                      >
                        -
                      </Text>
                    </TouchableOpacity>

                    <Text
                      style={[
                        styles.participantCount,
                        { color: t.colors.textPrimary },
                      ]}
                    >
                      {selectedParticipants}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.participantButton,
                        {
                          backgroundColor:
                            selectedParticipants === maxParticipants
                              ? t.colors.surfaceAlt
                              : t.colors.primary,
                        },
                      ]}
                      onPress={() =>
                        setSelectedParticipants(
                          Math.min(
                            maxParticipants as number,
                            selectedParticipants + 1,
                          ),
                        )
                      }
                      disabled={selectedParticipants === maxParticipants}
                    >
                      <Text
                        style={[
                          styles.participantButtonText,
                          {
                            color:
                              selectedParticipants === maxParticipants
                                ? t.colors.textSecondary
                                : "#FFFFFF",
                          },
                        ]}
                      >
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {pricePerParticipant && (
                    <Text
                      style={[
                        styles.pricePerUnit,
                        { color: t.colors.textSecondary },
                      ]}
                    >
                      {currency}
                      {price} per person
                    </Text>
                  )}
                </View>
              )}

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text
                  style={[styles.priceLabel, { color: t.colors.textSecondary }]}
                >
                  Total:
                </Text>
                <Text style={[styles.totalLabel, { color: t.colors.primary }]}>
                  {currency}
                  {selectedParticipants && pricePerParticipant
                    ? price * selectedParticipants
                    : price}
                </Text>
              </View>

              {/* Confirm button */}
              <ActionButton
                title={buttonText}
                onPress={handleConfirm}
                fullWidth
                loading={loading}
                disabled={loading}
                containerStyle={{ marginBottom: showWithdrawButton ? 12 : 0 }}
              />

              {/* Withdrawal button (optional) */}
              {showWithdrawButton && onWithdraw && (
                <ActionButton
                  title={withdrawButtonText}
                  onPress={handleWithdraw}
                  variant="outline"
                  fullWidth
                  disabled={loading}
                  containerStyle={{
                    borderColor: "#EF4444",
                    borderWidth: 1,
                  }}
                  textStyle={{
                    color: "#EF4444",
                  }}
                />
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    borderRadius: 16,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "left",
    marginBottom: 32,
  },
  eventInfo: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  participantContainer: {
    marginBottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  participantLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  participantChooser: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  participantButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  participantButtonText: {
    fontSize: 20,
    fontWeight: "600",
  },
  participantCount: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: "center",
  },
  pricePerUnit: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  priceContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  successIconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#6B7280",
    alignItems: "center",
    justifyContent: "center",
  },
  successMessageContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  successMessage: {
    fontSize: 16,
    textAlign: "center",
  },
});
