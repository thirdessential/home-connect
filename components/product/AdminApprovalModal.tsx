import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AdminApprovalModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onApprove: () => void | Promise<void>;
  onReject: (reason: string, details?: string) => void | Promise<void>;
  dealTitle: string;
  userName: string;
  orderQuantity: number;
  loading?: boolean;
};

const REJECTION_REASONS = [
  { value: "NOT_ELIGIBLE", label: "Not Eligible" },
  { value: "INSUFFICIENT_INFO", label: "Insufficient Information" },
  { value: "DUPLICATE_REQUEST", label: "Duplicate Request" },
  { value: "CAPACITY_REACHED", label: "Capacity Reached" },
  { value: "TERMS_NOT_MET", label: "Terms Not Met" },
  { value: "INVALID_SUBMISSION", label: "Invalid Submission" },
  { value: "OTHER", label: "Other (Please specify)" },
];

export default function AdminApprovalModal({
  isVisible,
  onClose,
  onApprove,
  onReject,
  dealTitle,
  userName,
  orderQuantity,
  loading = false,
}: AdminApprovalModalProps) {
  const t = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionMode, setRejectionMode] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherDetails, setOtherDetails] = useState<string>("");

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove();
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReason) {
      return;
    }

    setIsLoading(true);
    try {
      await onReject(selectedReason, otherDetails);
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRejectionMode(false);
    setSelectedReason("");
    setOtherDetails("");
    onClose();
  };

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    modal: {
      width: "90%",
      maxHeight: "85%",
      backgroundColor: t.colors.background,
      borderRadius: 12,
      padding: 20,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: t.colors.textPrimary,
      marginBottom: 8,
    },
    dealInfo: {
      fontSize: 13,
      color: t.colors.textSecondary,
      marginBottom: 4,
    },
    divider: {
      height: 1,
      backgroundColor: t.colors.border,
      marginVertical: 16,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: t.colors.textPrimary,
      marginBottom: 12,
    },
    reasonOption: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    reasonOptionSelected: {
      backgroundColor: "#FEE2E2",
      borderColor: "#EF4444",
    },
    reasonLabel: {
      fontSize: 14,
      color: t.colors.textPrimary,
      flex: 1,
      marginLeft: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 8,
      padding: 12,
      minHeight: 80,
      color: t.colors.textPrimary,
      fontSize: 14,
      textAlignVertical: "top",
    },
    buttonContainer: {
      gap: 12,
      marginTop: 16,
    },
    approveButton: {
      backgroundColor: "#10B981",
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    approveButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 15,
    },
    rejectButton: {
      backgroundColor: "#EF4444",
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    rejectButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 15,
    },
    cancelButton: {
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    cancelButtonText: {
      color: t.colors.textPrimary,
      fontWeight: "500",
      fontSize: 15,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      paddingVertical: 8,
    },
    backButtonText: {
      color: t.colors.primary,
      fontWeight: "600",
      fontSize: 14,
      marginLeft: 8,
    },
  });

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView style={styles.modal}>
            {rejectionMode ? (
              <>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setRejectionMode(false);
                    setSelectedReason("");
                    setOtherDetails("");
                  }}
                >
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    color={t.colors.primary}
                  />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Select Rejection Reason</Text>
                <Text style={styles.dealInfo}>
                  For: {userName} - {dealTitle}
                </Text>

                <View style={styles.divider} />

                <View style={styles.section}>
                  {REJECTION_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.value}
                      style={[
                        styles.reasonOption,
                        selectedReason === reason.value &&
                          styles.reasonOptionSelected,
                      ]}
                      onPress={() => setSelectedReason(reason.value)}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor:
                            selectedReason === reason.value
                              ? "#EF4444"
                              : t.colors.border,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {selectedReason === reason.value && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "#EF4444",
                            }}
                          />
                        )}
                      </View>
                      <Text style={styles.reasonLabel}>{reason.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedReason === "OTHER" && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Please specify:</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter rejection details (minimum 10 characters)"
                      placeholderTextColor={t.colors.textSecondary}
                      value={otherDetails}
                      onChangeText={setOtherDetails}
                      multiline
                      maxLength={500}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: t.colors.textSecondary,
                        marginTop: 8,
                        textAlign: "right",
                      }}
                    >
                      {otherDetails.length}/500
                    </Text>
                  </View>
                )}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.rejectButton,
                      (isLoading ||
                        loading ||
                        !selectedReason ||
                        (selectedReason === "OTHER" &&
                          otherDetails.length < 10)) && { opacity: 0.7 },
                    ]}
                    onPress={handleReject}
                    disabled={
                      isLoading ||
                      loading ||
                      !selectedReason ||
                      (selectedReason === "OTHER" && otherDetails.length < 10)
                    }
                  >
                    {isLoading || loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.rejectButtonText}>Reject Order</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setRejectionMode(false);
                      setSelectedReason("");
                      setOtherDetails("");
                    }}
                    disabled={isLoading || loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title}>Order Approval Request</Text>
                <Text style={styles.dealInfo}>Deal: {dealTitle}</Text>
                <Text style={styles.dealInfo}>
                  User: {userName} (Qty: {orderQuantity})
                </Text>

                <View style={styles.divider} />

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.approveButton,
                      (isLoading || loading) && { opacity: 0.7 },
                    ]}
                    onPress={handleApprove}
                    disabled={isLoading || loading}
                  >
                    {isLoading || loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.approveButtonText}>
                        Approve Order
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.rejectButton,
                      (isLoading || loading) && { opacity: 0.7 },
                    ]}
                    onPress={() => setRejectionMode(true)}
                    disabled={isLoading || loading}
                  >
                    <Text style={styles.rejectButtonText}>Reject Order</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    disabled={isLoading || loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
