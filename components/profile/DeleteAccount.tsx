import { USER_ROLES } from "@/assets/mocks/category";
import { usePermissions } from "@/hooks/usePermissions";
import { useProductStore } from "@/store/useBusinessStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { BusinessCategory } from "@/types/business.type";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ActionButton from "../inputs/ActionButton";

export default function DeleteAccount() {
  const t = useTheme();

  const { hasAnyRole } = usePermissions();
  const { deleteUser } = useUserStore();
  const { userProducts } = useProductStore();
  const user = useUserStore((s) => s.user);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<
    "select" | "confirm" | "deleting" | "success" | "error"
  >("select");
  const [errorMessage, setErrorMessage] = useState("");

  const toggleReason = (reasonId: string) => {
    if (selectedReasons.includes(reasonId)) {
      setSelectedReasons(selectedReasons.filter((id) => id !== reasonId));
    } else {
      setSelectedReasons([...selectedReasons, reasonId]);
    }
  };

  const handleDeletePress = () => {
    if (selectedReasons.length === 0) return;
    setCurrentStep("confirm");
  };

  const handleConfirmDelete = async () => {
    setCurrentStep("deleting");
    try {
      const deletionPromises: Promise<void>[] = [];

      // Check selected reasons and execute corresponding deletion logic
      selectedReasons.forEach((reason) => {
        if (reason === UserRole.RESIDENT || reason === UserRole.GUEST) {
          // Delete user for resident or guest
          if (user?._id) {
            deletionPromises.push(deleteUser(user._id));
          }
        } else if (reason === UserRole.BUSINESS) {
          // Delete all businesses associated with the user
          if (userProducts && userProducts.length > 0) {
            userProducts.forEach((business) => {
              if (business._id) {
                // TODO: Implement deleteBusiness method in useBusinessStore
                // deletionPromises.push(deleteBusiness(business._id));
              }
            });
          }
        }
      });

      // Execute all deletion operations
      await Promise.all(deletionPromises);

      setCurrentStep("success");

      // Navigate to login after 3 seconds
      setTimeout(() => {
        // TODO: Clear user session
        router.replace("/(auth)/login");
      }, 3000);
    } catch (_error) {
      setErrorMessage("Failed to delete account. Please try again later.");
      setCurrentStep("error");
    }
  };

  const handleBackToSelect = () => {
    setCurrentStep("select");
  };

  const handleRetry = () => {
    setErrorMessage("");
    setCurrentStep("confirm");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Success State */}
      {currentStep === "success" && (
        <View style={styles.confirmContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={48} color="#16A34A" />
          </View>
          <Text style={[styles.successTitle, { color: t.colors.textPrimary }]}>
            Account Deleted
          </Text>
          <Text
            style={[styles.successMessage, { color: t.colors.textSecondary }]}
          >
            Your account has been successfully deleted. You will be redirected
            to the login screen shortly.
          </Text>
        </View>
      )}

      {/* Error State */}
      {currentStep === "error" && (
        <View style={styles.confirmContainer}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="close" size={48} color="#EF4444" />
          </View>
          <Text style={[styles.errorTitle, { color: t.colors.textPrimary }]}>
            Deletion Failed
          </Text>
          <Text
            style={[styles.errorMessage, { color: t.colors.textSecondary }]}
          >
            {errorMessage ||
              "An error occurred while deleting your account. Please try again."}
          </Text>
          <View style={styles.confirmButtons}>
            <ActionButton
              title="Try Again"
              onPress={handleRetry}
              variant="primary"
              containerStyle={{ backgroundColor: "#EF4444" }}
            />
            <ActionButton
              title="Cancel"
              onPress={handleCancel}
              variant="outline"
            />
          </View>
        </View>
      )}

      {/* Deleting State */}
      {currentStep === "deleting" && (
        <View style={styles.deletingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text
            style={[styles.deletingText, { color: t.colors.textSecondary }]}
          >
            Deleting your account...
          </Text>
        </View>
      )}

      {/* Confirmation State */}
      {currentStep === "confirm" && (
        <View style={styles.confirmContainer}>
          <View style={styles.confirmIconCircle}>
            <Ionicons name="warning" size={48} color="#EF4444" />
          </View>
          <Text style={[styles.confirmTitle, { color: t.colors.textPrimary }]}>
            Delete Account?
          </Text>
          <Text
            style={[styles.confirmMessage, { color: t.colors.textSecondary }]}
          >
            This action cannot be undone. Are you absolutely sure you want to
            delete your account and all associated data?
          </Text>
          <View style={styles.confirmButtons}>
            <ActionButton
              title="Yes, Delete My Account"
              onPress={handleConfirmDelete}
              variant="primary"
              containerStyle={{ backgroundColor: "#EF4444" }}
            />
            <ActionButton
              title="Go Back"
              onPress={handleBackToSelect}
              variant="outline"
            />
          </View>
        </View>
      )}

      {/* Selection State */}
      {currentStep === "select" && (
        <>
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text
                style={[styles.subtitle, { color: t.colors.textSecondary }]}
              >
                We&apos;re sorry to see you go. Please let us know why
                you&apos;re leaving so we can improve our service.
              </Text>
            </View>

            <View style={styles.warningBox}>
              <Ionicons
                name="warning"
                size={24}
                color="#EF4444"
                style={styles.warningIcon}
              />
              <Text style={styles.warningText}>
                Warning: Deleting your account is permanent and cannot be
                undone. All your data, posts, and connections will be
                permanently removed.
              </Text>
            </View>

            <Text
              style={[styles.sectionTitle, { color: t.colors.textPrimary }]}
            >
              Why are you deleting your account?
            </Text>

            {USER_ROLES.filter((account: BusinessCategory) =>
              hasAnyRole([account.id as UserRole]),
            ).map((account: BusinessCategory) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.reasonCard,
                  selectedReasons.includes(account.id) &&
                    styles.reasonCardSelected,
                  {
                    backgroundColor: t.colors.lightBackground,
                    borderColor: t.colors.border,
                  },
                ]}
                onPress={() => toggleReason(account.id)}
                activeOpacity={0.7}
              >
                <View style={styles.reasonHeader}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: t.colors.background,
                        borderColor: t.colors.border,
                      },
                      selectedReasons.includes(account.id) &&
                        styles.checkboxChecked,
                    ]}
                  >
                    {selectedReasons.includes(account.id) && (
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.reasonLabel,
                      { color: t.colors.textPrimary },
                    ]}
                  >
                    {account.name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.reasonDescription,
                    { color: t.colors.textSecondary },
                  ]}
                >
                  {account.subtext}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View
            style={[
              styles.buttonContainer,
              { borderTopColor: t.colors.border },
            ]}
          >
            <ActionButton
              title="Delete My Account"
              onPress={handleDeletePress}
              variant="primary"
              disabled={selectedReasons.length === 0}
              containerStyle={{
                backgroundColor:
                  selectedReasons.length === 0 ? t.colors.border : "#EF4444",
                opacity: selectedReasons.length === 0 ? 0.5 : 1,
              }}
            />
            <ActionButton
              title="Cancel"
              onPress={handleCancel}
              variant="outline"
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    color: "#991B1B",
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  reasonCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  reasonCardSelected: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 1.5,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  reasonLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  reasonDescription: {
    fontSize: 14,
    marginLeft: 37,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  confirmContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  confirmButtons: {
    width: "100%",
    gap: 12,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  deletingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  deletingText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
});
