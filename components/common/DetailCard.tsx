import { Card } from "@/components/UI/Card";
import CircularImage from "@/components/form/CircularImage";
import ActionButton from "@/components/inputs/ActionButton";
import { getPendingColor } from "@/lib/adminHelper";
import { callUser, capitalizeWords } from "@/lib/utils";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Badge from "../UI/Badge";

interface DetailCardProps {
  request: any;
  onApprove: (id: string, type: string) => void;
  onReject: (id: string, type: string) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, selected: boolean) => void;
}

const DetailCard = memo(
  ({
    request,
    onApprove,
    onReject,
    isSelected,
    onSelectionChange,
  }: DetailCardProps) => {
    const t = useTheme();

    const getTypeColor = (type: string) => {
      switch (type) {
        case "Owner":
          return "#4A90E2";
        case "Business":
          return "#96CEB4";
        case "Tenant":
          return "#FFB84D";
        default:
          return t.colors.primary;
      }
    };
    return (
      <Card style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestHeaderLeft}>
            <Pressable
              style={[
                styles.checkbox,
                isSelected && {
                  backgroundColor: t.colors.primary,
                  borderColor: t.colors.primary,
                },
              ]}
              onPress={() => onSelectionChange(request.id, !isSelected)}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </Pressable>
            <Badge
              label={request.type}
              style={[
                styles.typeTag,
                { backgroundColor: getTypeColor(request.type) + "20" },
              ]}
              textStyle={[
                t.typography.small,
                { color: getTypeColor(request.type), fontWeight: "600" },
              ]}
            />
          </View>
          <Badge
            label={`Pending ${request.pendingDays} day${
              request.pendingDays > 1 ? "s" : ""
            }`}
            style={[
              styles.pendingTag,
              { backgroundColor: t.colors.skeletonBase },
            ]}
            textStyle={[
              t.typography.small,
              {
                color: getPendingColor(request.pendingDays),
                fontWeight: "500",
              },
            ]}
          />
        </View>

        <View style={styles.requestContent}>
          <View style={styles.requestProfile}>
            {typeof request.avatar === "string" &&
            request.avatar.startsWith("http") ? (
              <CircularImage
                uri={request.avatar}
                mode="view"
                onChange={(uri) => {}}
                size={60}
                loading={false}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarText]}>
                <Text style={styles.avatarLetters}>{request.avatar}</Text>
              </View>
            )}
            <View style={[styles.profileInfo, { flex: 1 }]}>
              <View style={styles.nameRow}>
                <Text
                  style={[t.typography.h4, { color: t.colors.textPrimary }]}
                >
                  {request.name}
                </Text>
                {request.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                )}
              </View>
              <Text
                style={[t.typography.body, { color: t.colors.textSecondary }]}
              >
                {capitalizeWords(
                  request.subtext || request?.category || request?.society,
                )}
              </Text>
            </View>
            <View>
              <Pressable
                style={styles.callIconCircle}
                onPress={() => callUser(request.phone)}
              >
                <Ionicons name="call" size={16} color="#374151" />
              </Pressable>
            </View>
          </View>

          <View style={styles.requestDetails}>
            <View style={styles.detailRow}>
              <Text
                style={[
                  t.typography.small,
                  { color: t.colors.textSecondary, fontWeight: "500" },
                ]}
              >
                {request.type === "service"
                  ? request?.serviceType === "daily-help"
                    ? "Service / Category"
                    : "Profession / Service"
                  : request.type === "resident"
                    ? "Flat / Tower"
                    : request.type === "business"
                      ? "Address"
                      : "Category"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text
                style={[
                  {
                    color: t.colors.textPrimary,
                    fontSize: 20,
                    fontWeight: "600",
                  },
                ]}
              >
                {request.type === "resident"
                  ? request.flatTower
                  : request.type === "business"
                    ? request.address
                    : request.type === "service"
                      ? request.serviceType === "daily-help"
                        ? "Domestic Help"
                        : request.additionalInfo
                      : request.flatTower ||
                        request.address ||
                        request.category}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 16 }}>
              {request.type === "resident" && <Text>{request.from}</Text>}
            </View>
          </View>

          <View
            style={[styles.requestMeta, { backgroundColor: t.colors.gray1 }]}
          >
            <View style={styles.metaRow}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={t.colors.textSecondary}
              />
              <Text
                style={[t.typography.small, { color: t.colors.textSecondary }]}
              >
                Applied: {request.appliedDate}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={t.colors.textSecondary}
              />
              <Text
                style={[t.typography.small, { color: t.colors.textSecondary }]}
              >
                From: Pune
              </Text>
            </View>
          </View>

          <View style={styles.requestActions}>
            <ActionButton
              title="Reject"
              variant="ghost"
              size="sm"
              fullWidth={false}
              containerStyle={[
                styles.actionButton,
                { backgroundColor: t.colors.skeletonBase },
              ]}
              textStyle={[
                t.typography.button1,
                {
                  color: t.colors.textSecondary,
                },
              ]}
              onPress={() => onReject(request.id, request.type)}
            />
            <ActionButton
              title="Approve"
              variant="primary"
              size="sm"
              fullWidth={false}
              containerStyle={[styles.actionButton]}
              textStyle={[t.typography.button1, { color: "#fff" }]}
              onPress={() => onApprove(request.id, request.type)}
            />
          </View>
        </View>
      </Card>
    );
  },
);

DetailCard.displayName = "DetailCard";

const styles = StyleSheet.create({
  callIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FCF6ED",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  requestCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    // padding: 16,
    paddingHorizontal: 0,
    borderRadius: 12,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  requestHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingTag: {
    marginRight: 16,
    paddingVertical: 4,
  },
  requestContent: {
    gap: 16,
  },
  requestProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    backgroundColor: "#96CEB4",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetters: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  requestDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  proofButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#FFF5F0",
  },
  requestMeta: {
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  requestActions: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default DetailCard;
