import { usePermissions } from "@/hooks/usePermissions";
import { Delete } from "@/lib/httpMethods";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ActionButton from "../inputs/ActionButton";
import { styles } from "./DeleteAccount.styles";

type Target = "resident" | "business";

// Resident and Business are deleted independently via their own endpoints —
// deleting one never touches the other. Identity is taken from the auth
// token on the backend, never from a client-sent id.
const DELETE_ENDPOINT: Record<Target, string> = {
  resident: "/api/user/resident-account",
  business: "/api/business/account",
};

export default function DeleteAccount() {
  const t = useTheme();
  const { hasRole } = usePermissions();
  const { loading } = useUserStore();
  const user = useUserStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const hasResident = hasRole(UserRole.RESIDENT);
  const hasBusiness = hasRole(UserRole.BUSINESS);
  const needsSelection = hasResident && hasBusiness;

  const [target, setTarget] = useState<Target | null>(
    needsSelection ? null : hasBusiness ? "business" : "resident",
  );
  const [agreed, setAgreed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const submittingRef = useRef(false);

  const targetLabel = useMemo(
    () => (target === "business" ? "Business" : "Resident"),
    [target],
  );

  const handleLogoutInstead = () => {
    signOut();
    router.replace("/(auth)/login");
  };

  const handleDelete = async () => {
    if (!agreed || !user?._id || !target || submittingRef.current) return;
    submittingRef.current = true;
    setIsDeleting(true);
    setErrorMessage("");
    try {
      const response = await Delete<{ success: boolean; message?: string }>(
        DELETE_ENDPOINT[target],
      );
      if (!response?.success) {
        throw new Error(response?.message || "Failed to delete account");
      }
      // success:true → clear token + every store (user, society, feeds,
      // business, etc.) and drop to the existing Guest/login flow, same as a
      // normal logout. Reused as-is — see useAuthStore.signOut.
      signOut();
      router.replace("/(auth)/login");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to delete account. Please try again later.");
    } finally {
      submittingRef.current = false;
      setIsDeleting(false);
    }
  };

  // Step 1 — which profile to delete, only asked when the authenticated
  // user actually holds both roles (never inferred from client-only state).
  if (needsSelection && !target) {
    return (
      <View style={styles.container}>
        <View style={styles.selectHeader}>
          <Text style={[styles.selectTitle, { color: t.colors.textPrimary }]}>
            Which profile do you want to delete?
          </Text>
        </View>
        {(["resident", "business"] as Target[]).map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.reasonCard,
              { backgroundColor: t.colors.lightBackground, borderColor: t.colors.border },
            ]}
            onPress={() => setTarget(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.reasonLabel, { color: t.colors.textPrimary }]}>
              {option === "business" ? "Delete Business" : "Delete Resident"}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={t.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.confirmIconCircle}>
        <Ionicons name="warning" size={48} color="#EF4444" />
      </View>
      <Text style={[styles.confirmTitle, { color: t.colors.textPrimary }]}>
        Delete Account
      </Text>
      <Text style={[styles.confirmMessage, { color: t.colors.textSecondary }]}>
        Deleting your {targetLabel} account will permanently remove your
        profile, posts, activities, and related data.
      </Text>

      {errorMessage ? (
        <Text style={styles.warningText}>{errorMessage}</Text>
      ) : null}

      <TouchableOpacity
        style={styles.agreeRow}
        onPress={() => setAgreed((v) => !v)}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        <View
          style={[
            styles.checkbox,
            { backgroundColor: t.colors.white, borderColor: t.colors.border },
            agreed && styles.checkboxChecked,
          ]}
        >
          {agreed && <Ionicons name="checkmark" size={18} color="#fff" />}
        </View>
        <Text style={[styles.agreeText, { color: t.colors.textPrimary }]}>
          I understand that my data, posts, and activities will be
          permanently removed.
        </Text>
      </TouchableOpacity>

      <View style={styles.confirmButtons}>
        {isDeleting ? (
          <ActivityIndicator size="large" color="#EF4444" />
        ) : (
          <ActionButton
            title="Delete Account"
            onPress={handleDelete}
            variant="primary"
            disabled={!agreed || loading}
            containerStyle={{
              backgroundColor: !agreed ? t.colors.border : "#EF4444",
              opacity: !agreed ? 0.5 : 1,
            }}
          />
        )}
        <ActionButton
          title="Logout Instead"
          onPress={handleLogoutInstead}
          variant="outline"
          disabled={isDeleting}
        />
      </View>
    </View>
  );
}
