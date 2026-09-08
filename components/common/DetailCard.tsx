import { Card } from "@/components/UI/Card";
import CircularImage from "@/components/form/CircularImage";
import ActionButton from "@/components/inputs/ActionButton";
import ViewModal from "@/components/modals/ViewModal";
import { getPendingColor } from "@/lib/adminHelper";
import { callUser, capitalizeWords } from "@/lib/utils";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Badge from "../UI/Badge";

interface DetailCardProps {
  request: any;
  onApprove: (id: string, type: string) => void;
  onReject: (id: string, type: string) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, selected: boolean) => void;
  onRequestInfo?: (id: string, type: string) => void;
}

// Two-initials fallback from the user's name: "Priya Sharma" -> "PS".
const getInitials = (name?: string) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const DetailCard = memo(
  ({
    request,
    onApprove,
    onReject,
    isSelected,
    onSelectionChange,
    onRequestInfo,
  }: DetailCardProps) => {
    const t = useTheme();
    const [detailsVisible, setDetailsVisible] = useState(false);
    const hasPhoto =
      typeof request.avatar === "string" && request.avatar.startsWith("http");
    const initials = getInitials(request.name);

    // Every document/photo the request may carry, flattened into one list —
    // drives the single "Attachments" thumbnail + "+N" row (reference UI),
    // replacing what used to be a separate full-width row per document type.
    const attachments: string[] = [
      request.residenceProof,
      request.registrationProof,
      request.selfie,
      request.logoUrl,
      ...((request.photos ?? []).map((p: any) => p.url || p.photo_url)),
    ].filter(Boolean);

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
    const openDetails = () => setDetailsVisible(true);

    return (
      <>
      <Pressable onPress={openDetails}>
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
              label={request.type === "business" ? "Business verification" : "Resident verification"}
              style={[
                styles.typeTag,
                { backgroundColor: request.type === "business" ? "#EFEBFD" : "#EAF0FE" },
              ]}
              textStyle={[
                t.typography.small,
                { color: request.type === "business" ? "#6E4FE8" : "#2F5FE0", fontWeight: "700", fontSize: 11 },
              ]}
            />
          </View>
          <Text
            style={[t.typography.small, styles.agoText, { color: t.colors.textSecondary }]}
          >
            {request.pendingDays > 0
              ? `${request.pendingDays} day${request.pendingDays > 1 ? "s" : ""} ago`
              : "Today"}
          </Text>
        </View>

        <View style={styles.requestContent}>
          <View style={styles.requestProfile}>
            {hasPhoto ? (
              <CircularImage
                uri={request.avatar}
                mode="view"
                onChange={(uri) => {}}
                size={46}
                loading={false}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarText]}>
                <Text style={styles.avatarLetters}>{initials}</Text>
              </View>
            )}
            <View style={[styles.profileInfo, { flex: 1 }]}>
              <View style={styles.nameRow}>
                <Text
                  style={[t.typography.h4, { color: t.colors.textPrimary }]}
                >
                  {request.name}
                </Text>
                {request.status === "approved" ? (
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                ) : (
                  <View
                    style={[
                      styles.statusBadge,
                      request.status === "rejected" && styles.statusBadgeRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        request.status === "rejected" && styles.statusBadgeTextRejected,
                      ]}
                    >
                      {request.status === "rejected" ? "Rejected" : "New"}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[t.typography.body, { color: t.colors.textSecondary }]}
                numberOfLines={1}
              >
                {request.type === "business"
                  ? capitalizeWords(request.category || request.address)
                  : capitalizeWords(request.flatTower || request.subtext || request?.society)}
              </Text>

              {/* Phone / applied date / address — stacked, indented under the name column */}
              {request.phone ? (
                <Pressable style={styles.metaRow} onPress={() => callUser(request.phone)}>
                  <Ionicons name="call-outline" size={13} color={t.colors.textSecondary} />
                  <Text style={[t.typography.small, { color: t.colors.textSecondary }]}>
                    {request.phone}
                  </Text>
                </Pressable>
              ) : null}
              {request.appliedDate ? (
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color={t.colors.textSecondary} />
                  <Text style={[t.typography.small, { color: t.colors.textSecondary }]}>
                    Applied {request.appliedDate}
                  </Text>
                </View>
              ) : null}
              {(request.address || request.locationName || request.from) ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color={t.colors.textSecondary} />
                  <Text
                    style={[t.typography.small, { color: t.colors.textSecondary, flexShrink: 1 }]}
                    numberOfLines={1}
                  >
                    {request.address || request.locationName || request.from}
                  </Text>
                </View>
              ) : null}
              {request.email ? (
                <View style={styles.metaRow}>
                  <Ionicons name="mail-outline" size={13} color={t.colors.textSecondary} />
                  <Text style={[t.typography.small, { color: t.colors.textSecondary }]}>
                    {request.email}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Attachments — one thumbnail + a dynamic "+N" tile for the rest */}
          {attachments.length > 0 ? (
            <View style={styles.attachmentsRow}>
              <Text style={[t.typography.small, styles.attachmentsLabel]}>Attachments</Text>
              <Image source={{ uri: attachments[0] }} style={styles.docThumbSm} />
              {attachments.length > 1 ? (
                <View style={styles.attachmentMoreThumb}>
                  <Text style={styles.attachmentMoreText}>+{attachments.length - 1}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* "View on map" — only when coordinates exist; address text itself
              already renders in the meta stack above. */}
          {request.latitude != null && request.longitude != null ? (
            <Pressable
              style={styles.mapLinkRow}
              onPress={() =>
                Linking.openURL(
                  `https://maps.google.com/?q=${request.latitude},${request.longitude}`,
                )
              }
            >
              <Text style={[t.typography.small, { color: "#1B6E3C", fontWeight: "700" }]}>
                View on map
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.requestActions}>
            <ActionButton
              title="Reject"
              variant="ghost"
              size="sm"
              fullWidth={false}
              leftIconName="close-circle-outline"
              iconColor="#DC2626"
              containerStyle={[styles.rejectBtn]}
              textStyle={[t.typography.button1, { color: "#DC2626" }]}
              onPress={() => onReject(request.id, request.type)}
            />
            <ActionButton
              title="Request info"
              variant="ghost"
              size="sm"
              fullWidth={false}
              leftIconName="chatbubble-ellipses-outline"
              iconColor="#666D62"
              containerStyle={[styles.infoBtn]}
              textStyle={[t.typography.button1, { color: "#666D62" }]}
              // No backend route exists to notify an applicant — VERIFICATION_STATUS
              // is only pending/approved/rejected and /api/admin/resident/approve
              // 400s on anything else. Until one ships, say so instead of
              // claiming a message was sent.
              onPress={() =>
                onRequestInfo
                  ? onRequestInfo(request.id, request.type)
                  : Alert.alert(
                      "Not Available Yet",
                      "Requesting more information from an applicant isn't supported yet. Please contact them directly, or reject with a reason explaining what's missing.",
                    )
              }
            />
            <ActionButton
              title="Approve"
              variant="primary"
              size="sm"
              fullWidth={false}
              leftIconName="checkmark-circle-outline"
              iconColor="#fff"
              containerStyle={[styles.approveBtn]}
              textStyle={[t.typography.button1, { color: "#fff" }]}
              onPress={() => onApprove(request.id, request.type)}
            />
          </View>
        </View>
      </Card>
      </Pressable>
      <ViewModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        onApprove={async () => onApprove(request.id, request.type)}
        onReject={async () => onReject(request.id, request.type)}
        data={{
          id: request.id,
          name: request.type !== "business" ? request.name : undefined,
          businessTitle: request.type === "business" ? request.name : undefined,
          email: request.email,
          phone: request.phone,
          flatNo: request.unitFlat,
          building: request.buildingBlock,
          status: request.status,
          requestDate: request.appliedDate,
          description: request.description,
          completeAddress: request.address || request.location || request.from,
          category: request.category,
          images: attachments.length ? attachments : undefined,
        }}
      />
      </>
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
    borderRadius: 18,
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
  agoText: {
    marginRight: 16,
    fontSize: 12,
  },
  statusBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadgeRejected: { backgroundColor: "#FEE2E2" },
  statusBadgeTextRejected: { color: "#DC2626" },
  requestContent: {
    gap: 10,
  },
  requestProfile: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarText: {
    backgroundColor: "#1B6E3C",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetters: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  mapLinkRow: { paddingHorizontal: 16 },
  attachmentsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  attachmentsLabel: { color: "#9A9C90", fontWeight: "600", marginRight: 2 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  docFullLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, marginRight: 8 },
  docThumbSm: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#F3F1EA",
  },
  attachmentMoreThumb: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "rgba(30,36,31,0.62)",
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentMoreText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  requestActions: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F0D3CC",
  },
  infoBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  approveBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#1B6E3C",
  },
});

export default DetailCard;
