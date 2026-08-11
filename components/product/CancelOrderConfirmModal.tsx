import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type CancelOrderConfirmModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  orderQuantity: number;
  productName: string;
  loading?: boolean;
};

export default function CancelOrderConfirmModal({
  isVisible,
  onClose,
  onConfirm,
  orderQuantity,
  productName,
  loading = false,
}: CancelOrderConfirmModalProps) {
  const t = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    modal: {
      width: "85%",
      backgroundColor: t.colors.background,
      borderRadius: 12,
      padding: 24,
      alignItems: "center",
    },
    icon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "#FEE2E2",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: t.colors.textPrimary,
      marginBottom: 8,
      textAlign: "center",
    },
    message: {
      fontSize: 14,
      color: t.colors.textSecondary,
      textAlign: "center",
      marginBottom: 6,
    },
    details: {
      fontSize: 13,
      color: t.colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
      fontWeight: "500",
    },
    buttonContainer: {
      width: "100%",
      gap: 12,
    },
    confirmButton: {
      backgroundColor: "#EF4444",
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    confirmButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
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
      fontSize: 16,
    },
  });

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modal}>
            <View style={styles.icon}>
              <Ionicons name="trash" size={32} color="#EF4444" />
            </View>

            <Text style={styles.title}>Cancel Order</Text>
            <Text style={styles.message}>
              Are you sure you want to cancel this order for {productName}?
            </Text>
            <Text style={styles.details}>
              Quantity: {orderQuantity} unit{orderQuantity !== 1 ? "s" : ""}
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (isLoading || loading) && { opacity: 0.7 },
                ]}
                onPress={handleConfirm}
                disabled={isLoading || loading}
              >
                {isLoading || loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Cancel Order</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isLoading || loading}
              >
                <Text style={styles.cancelButtonText}>Keep Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
