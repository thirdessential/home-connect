import { Card } from "@/components/UI/Card";
import CircularImage from "@/components/form/CircularImage";
import ActionButton from "@/components/inputs/ActionButton";
import { getPendingColor } from "@/lib/adminHelper";
import { callUser, capitalizeWords } from "@/lib/utils";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
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
    const hasPhoto =
      typeof request.avatar === "string" && request.avatar.startsWith("http");
    const initials = getInitials(request.name);

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
    const openDetails = () => {
      const detailType = request.type === "user" || request.type === "resident" ? "resident" : "business";
      const rawId = request.businessId ?? request.id;
      router.push({ pathname: "/(tabs)/profile/admin-request-details", params: { type: detailType, id: String(rawId) } });
    };

    return (
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
              label={`${String(request.type)} Verification Request`.toUpperCase()}
              style={[styles.typeTag, { backgroundColor: "#E8F0FE" }]}
              textStyle={[
                t.typography.small,
                { color: "#2563EB", fontWeight: "700", fontSize: 10 },
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
                size={60}
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
                  : capitalizeWords(request.subtext || request?.society)}
              </Text>
            </View>
          </View>

          {/* Flat/Tower/Owner (resident) or Address/Category (business) — highlighted info row */}
          {(request.flatTower || request.address || request.ownerOrTenant) ? (
            <View style={[styles.infoRow, { backgroundColor: t.colors.gray1 }]}>
              <Ionicons name="home-outline" size={14} color="#374151" />
              <Text style={[t.typography.small, styles.infoRowText]} numberOfLines={1}>
                {[
                  request.type === "business" ? request.address : request.flatTower,
                  request.ownerOrTenant ? capitalizeWords(request.ownerOrTenant) : null,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </Text>
            </View>
          ) : null}

          {/* Phone + Applied date row */}
          <View style={styles.detailsSplitRow}>
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
                  Applied: {request.appliedDate}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Email row */}
          {request.email ? (
            <View style={[styles.metaRow, { paddingHorizontal: 16 }]}>
              <Ionicons name="mail-outline" size={13} color={t.colors.textSecondary} />
              <Text style={[t.typography.small, { color: t.colors.textSecondary }]}>
                {request.email}
              </Text>
            </View>
          ) : null}

          {/* Residence / Registration proof — full-width row, thumbnail on the right */}
          {request.residenceProof || request.registrationProof ? (
            <View style={styles.docFullRow}>
              <View style={styles.docFullLeft}>
                <Ionicons name="document-text-outline" size={16} color="#374151" />
                <View>
                  <Text style={[t.typography.small, styles.docFullTitle]}>
                    {request.residenceProof ? "Residence Proof" : "Registration Proof"}
                  </Text>
                  <Text style={[t.typography.small, { color: t.colors.textSecondary }]}>
                    {request.proofType || "Document"}
                  </Text>
                </View>
              </View>
              <Image
                source={{ uri: request.residenceProof || request.registrationProof }}
                style={styles.docThumbSm}
              />
            </View>
          ) : null}

          {/* Selfie — full-width row */}
          {request.selfie ? (
            <View style={styles.docFullRow}>
              <View style={styles.docFullLeft}>
                <Ionicons name="person-outline" size={16} color="#374151" />
                <Text style={[t.typography.small, styles.docFullTitle]}>Selfie</Text>
              </View>
              <Image source={{ uri: request.selfie }} style={styles.docThumbSm} />
            </View>
          ) : null}

          {/* Logo / photos — full-width rows */}
          {request.logoUrl ? (
            <View style={styles.docFullRow}>
              <View style={styles.docFullLeft}>
                <Ionicons name="storefront-outline" size={16} color="#374151" />
                <Text style={[t.typography.small, styles.docFullTitle]}>Logo</Text>
              </View>
              <Image source={{ uri: request.logoUrl }} style={styles.docThumbSm} />
            </View>
          ) : null}
          {(request.photos ?? []).slice(0, 3).map((p: any, i: number) => (
            <View key={p.id ?? i} style={styles.docFullRow}>
              <View style={styles.docFullLeft}>
                <Ionicons name="image-outline" size={16} color="#374151" />
                <Text style={[t.typography.small, styles.docFullTitle]}>Photo</Text>
              </View>
              <Image source={{ uri: p.url || p.photo_url }} style={styles.docThumbSm} />
            </View>
          ))}

          {/* Location — own row, "View on map" aligned right */}
          {(request.locationName || request.from) ? (
            <View style={styles.docFullRow}>
              <View style={styles.docFullLeft}>
                <Ionicons name="location-outline" size={16} color="#374151" />
                <Text style={[t.typography.small, styles.docFullTitle]} numberOfLines={1}>
                  {request.locationName || request.from}
                </Text>
              </View>
              {request.latitude != null && request.longitude != null ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(
                      `https://maps.google.com/?q=${request.latitude},${request.longitude}`,
                    )
                  }
                >
                  <Text style={[t.typography.small, { color: "#166534", fontWeight: "700" }]}>
                    View on map
                  </Text>
                </Pressable>
              ) : null}
            </View>
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
              title="Request More Information"
              variant="ghost"
              size="sm"
              fullWidth={false}
              leftIconName="chatbubble-ellipses-outline"
              iconColor="#15803D"
              containerStyle={[styles.infoBtn]}
              textStyle={[t.typography.button1, { color: "#15803D" }]}
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
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    backgroundColor: "#166534",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetters: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  infoRowText: { color: "#374151", fontWeight: "600", flex: 1 },
  detailsSplitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  docFullRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0EEE9",
  },
  docFullLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, marginRight: 8 },
  docFullTitle: { color: "#1F2430", fontWeight: "600" },
  docThumbSm: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
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
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  infoBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  approveBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#166534",
  },
});

export default DetailCard;
