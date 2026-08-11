import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type EditQuantityModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onSave: (newQuantity: number, newTotalAmount: number) => void | Promise<void>;
  currentQuantity: number;
  productName: string;
  minQuantity?: number;
  maxQuantity?: number;
  unitPrice?: number; // price per unit for total calculation
  previousQuantity?: number; // user's previous ordered quantity, if any
  successTitle?: string;
  successMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  autoCloseDelay?: number;
};

export default function EditQuantityModal({
  isVisible,
  onClose,
  onSave,
  currentQuantity,
  productName,
  minQuantity = 1,
  maxQuantity = 100,
  unitPrice = 0,
  previousQuantity = 0,
  successTitle = "Order Updated!",
  successMessage = "Your order has been successfully updated.",
  errorTitle = "Update Failed",
  errorMessage = "Could not update your order. Please try again.",
  autoCloseDelay = 2000,
}: EditQuantityModalProps) {
  const t = useTheme();

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // Pre-fill with previousQuantity if exists, else 1
  const defaultQuantity = useMemo(() => {
    const start = previousQuantity > 0 ? previousQuantity : 1;
    return Math.min(start, maxQuantity);
  }, [previousQuantity, maxQuantity]);

  const [quantity, setQuantity] = useState(defaultQuantity);

  // When opening the modal or when constraints change, reset to default
  useEffect(() => {
    if (isVisible) {
      setQuantity(defaultQuantity);
    }
  }, [isVisible, defaultQuantity]);

  const incrementQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    // Minimum is 0 to allow order cancellation
    if (quantity > 0) {
      setQuantity(quantity - 1);
    }
  };

  const handleSave = async () => {
    const qty = Number(quantity) || 0;
    if (qty === 0) {
      Alert.alert(
        "Cancel Order",
        "Do you want to cancel this order?",
        [
          {
            text: "No",
            style: "cancel"
          },
          {
            text: "Yes",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              try {
                await onSave(0, 0);
                setShowSuccess(true);
                setTimeout(() => {
                  setShowSuccess(false);
                  setLoading(false);
                  onClose();
                }, autoCloseDelay);
              } catch (error) {
                setLoading(false);
                setShowError(true);
              }
            }
          }
        ]
      );
      return;
    }

    if (qty > maxQuantity) {
      Alert.alert("Error", `Cannot order more than the maximum allowed quantity of ${maxQuantity}.`);
      return;
    }

    const totalAmount = qty * (Number(unitPrice) > 0 ? Number(unitPrice) : 0);

    setLoading(true);
    try {
      await onSave(qty, totalAmount);
      setShowSuccess(true);

      // Auto-close after delay
      setTimeout(() => {
        setShowSuccess(false);
        setLoading(false);
        onClose();
      }, autoCloseDelay);
    } catch (error) {
      setLoading(false);
      setShowError(true);
    }
  };

  const handleClose = () => {
    setQuantity(defaultQuantity);
    setShowSuccess(false);
    setShowError(false);
    setLoading(false);
    onClose();
  };

  const handleRetry = () => {
    setShowError(false);
  };

  const previousAmount = useMemo(() => {
    const qty = Number(previousQuantity) > 0 ? Number(previousQuantity) : 0;
    const price = Number(unitPrice) > 0 ? Number(unitPrice) : 0;
    return qty * price;
  }, [previousQuantity, unitPrice]);

  const updatedAmount = useMemo(() => {
    const qty = Number(quantity) > 0 ? Number(quantity) : 0;
    const price = Number(unitPrice) > 0 ? Number(unitPrice) : 0;
    return qty * price;
  }, [quantity, unitPrice]);

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    sheet: {
      backgroundColor: t.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: Platform.OS === "ios" ? 34 : 16,
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: t.colors.textPrimary,
    },
    closeButton: {
      padding: 4,
    },
    productName: {
      fontSize: 15,
      color: t.colors.textSecondary,
      marginBottom: 20,
    },
    quantityContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    quantityButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: t.colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    disabledButton: {
      opacity: 0.5,
    },
    quantityValue: {
      fontSize: 20,
      fontWeight: "600",
      marginHorizontal: 24,
      color: t.colors.textPrimary,
      minWidth: 40,
      textAlign: "center",
    },
    saveButton: {
      backgroundColor: t.colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 8,
    },
    saveButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
    cancelButton: {
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 10,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    cancelButtonText: {
      color: t.colors.textPrimary,
      fontWeight: "500",
      fontSize: 16,
    },
    successIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "#10B981",
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      marginVertical: 20,
    },
    errorIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "#EF4444",
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      marginVertical: 20,
    },
    statusTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: t.colors.textPrimary,
      textAlign: "center",
      marginBottom: 8,
    },
    statusMessage: {
      fontSize: 15,
      color: t.colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    priceBlock: {
      marginTop: 8,
      marginBottom: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.lightBackground,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 6,
    },
    priceLabel: {
      color: t.colors.textSecondary,
      fontSize: 14,
    },
    priceValue: {
      color: t.colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheet}>
              {/* Success State */}
              {showSuccess ? (
                <>
                  <View style={styles.successIconCircle}>
                    <Ionicons name="checkmark" size={36} color="#fff" />
                  </View>
                  <Text style={styles.statusTitle}>{successTitle}</Text>
                  <Text style={styles.statusMessage}>{successMessage}</Text>
                </>
              ) : showError ? (
                /* Error State */
                <>
                  <View style={styles.header}>
                    <Text style={styles.title}>Update Failed</Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={handleClose}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={t.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.errorIconCircle}>
                    <Ionicons name="close" size={36} color="#fff" />
                  </View>
                  <Text style={styles.statusTitle}>{errorTitle}</Text>
                  <Text style={styles.statusMessage}>{errorMessage}</Text>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleRetry}
                  >
                    <Text style={styles.saveButtonText}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                  >
                    <Text style={styles.cancelButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* Normal State */
                <>
                  <View style={styles.header}>
                    <Text style={styles.title}>Edit Order Quantity</Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={handleClose}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={t.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.productName}>{productName}</Text>

                  {maxQuantity < 99999 && (
                    <Text
                      style={{
                        textAlign: "center",
                        color: "#E28743",
                        fontSize: 14,
                        marginBottom: 16,
                        fontWeight: "600",
                      }}
                    >
                      Only {maxQuantity} units available to order
                    </Text>
                  )}

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={[
                        styles.quantityButton,
                        quantity <= 0 && styles.disabledButton,
                      ]}
                      onPress={decrementQuantity}
                      disabled={quantity <= 0}
                    >
                      <Ionicons name="remove" size={22} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.quantityValue}>{quantity}</Text>

                    <TouchableOpacity
                      style={[
                        styles.quantityButton,
                        quantity >= maxQuantity && styles.disabledButton,
                      ]}
                      onPress={incrementQuantity}
                      disabled={quantity >= maxQuantity}
                    >
                      <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Price Summary */}
                  <View style={styles.priceBlock}>
                    {Number(previousQuantity) > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>
                          Previous order ({previousQuantity})
                        </Text>
                        <Text style={styles.priceValue}>
                          {COMMON_CONSTANTS.CURRENCY} {previousAmount}
                        </Text>
                      </View>
                    )}
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { fontWeight: "700" }]}>
                        New total ({quantity})
                      </Text>
                      <Text style={styles.priceValue}>
                        {COMMON_CONSTANTS.CURRENCY} {updatedAmount}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton, loading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Update Order</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}
