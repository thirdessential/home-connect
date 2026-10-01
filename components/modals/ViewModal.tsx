import ImageCarousel from "@/components/UI/ImageCarousel";
import { useTheme } from "@/theme/theme";
import { ProductPrice } from "@/types/business.type";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Animated, Image } from "react-native";
import UserAvatar from "@/components/UI/UserAvatar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  useWindowDimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { joinWithComma } from "@/lib/utils";
import CircularImage from "../form/CircularImage";

interface ViewModalProps {
  visible: boolean;
  onClose: () => void;
  onApprove?: () => Promise<boolean | void>;
  onReject?: (reason: string) => Promise<void>;
  data: {
    id: string;
    name?: string;
    businessTitle?: string;
    email?: string;
    phone?: string;
    society?: string;
    ownerOrTenant?: string;
    building?: string;
    businessPhone?: string;
    flatNo?: string;
    status?: string;
    requestDate?: string | number | Date | null;
    description?: string;
    completeAddress?: string;
    category?: string;
    images?: string[];
    /** Pre-built rows from the caller; `always` rows show "Not provided" when empty. */
    fields?: { label: string; value?: unknown; phone?: boolean; always?: boolean }[];
    profileImage?: string;
    documents?: { label: string; url: string }[];
    price?: ProductPrice;
    type?: string;
    report?: {
      reason: string[];
    };
    requestType?: string;
    businessInfo?: {
      businessName: string;
      description: string;
      category: string;
    };
  };
}

interface FieldProps {
  label: string;
  value: string;
}

const Field = ({ label, value }: FieldProps) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
      {label}
    </Text>
    <Text style={{ fontSize: 16 }}>{value}</Text>
  </View>
);

// ---- display helpers ------------------------------------------------------
// Accepts epoch ms, ISO string or Date. A pre-formatted locale string (the old
// `appliedDate`) is what produced "Invalid Date", so unparseable input -> N/A.
const formatRequestDate = (raw: unknown): string => {
  if (raw === null || raw === undefined || raw === "") return "N/A";
  const d = raw instanceof Date ? raw : new Date(raw as any);
  if (Number.isNaN(d.getTime())) return "N/A";
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  return `${date}, ${String(h).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${ampm}`;
};

// Hide null / undefined / empty / placeholder values (e.g. "Unknown Address").
const hasValue = (v: unknown): v is string =>
  typeof v === "string" && !!v.trim() && !/^(null|undefined|n\/a)$/i.test(v.trim()) && !/^unknown\b/i.test(v.trim());

const capitalize = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

// wa.me needs digits only with country code; assume India for bare 10-digit numbers.
const whatsappUrl = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
};

type Row = { label: string; value: string; phone?: boolean; bold?: boolean };

// A real button: filled background, icon + label, press scale. Colors are
// static (no style callbacks) so they render identically on Android and iOS.
function ActionPill({
  label,
  icon,
  bg,
  pressedBg,
  color,
  onPress,
  disabled,
  loading,
  height = 54,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  bg: string;
  pressedBg: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  height?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [down, setDown] = useState(false);
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  return (
    <Pressable
      style={{ flex: 1 }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => { setDown(true); to(0.97); }}
      onPressOut={() => { setDown(false); to(1); }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={{
          height,
          borderRadius: 12,
          backgroundColor: down ? pressedBg : bg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: disabled && !loading ? 0.6 : 1,
          transform: [{ scale }],
        }}
      >
        {loading ? (
          <ActivityIndicator color={color} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={20} color={color} /> : null}
            <Text style={{ color, fontSize: 16, fontFamily: "Manrope_600SemiBold" }}>{label}</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function ViewModal({
  visible,
  onClose,
  onApprove,
  onReject,
  data,
}: ViewModalProps) {
  const t = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const busyRef = useRef(false);

  // Awaits the real approve call, blocks double taps, closes only on success.
  const handleApprove = async () => {
    if (!onApprove || busyRef.current) return;
    busyRef.current = true;
    setIsSubmitting(true);
    try {
      const ok = await onApprove();
      // `false` = the API failed (dashboard already showed the error toast):
      // keep this sheet open so the admin can retry.
      if (ok !== false) {
        setConfirm(null);
        onClose();
      } else {
        setConfirm(null);
      }
    } catch (error) {
      console.error("Error approving request:", error);
    } finally {
      busyRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Rejection reason is collected by the dashboard's own RejectModal; close
  // this sheet first so two native modals never stack.
  const handleReject = async () => {
    if (!onReject || busyRef.current) return;
    setConfirm(null);
    onClose();
    await onReject("");
  };

  // Confirmation step shown inside this sheet (no extra native modal).
  const [confirm, setConfirm] = useState<null | "approve" | "reject">(null);
  const [viewer, setViewer] = useState<string | null>(null);
  const targetName = data.businessTitle ?? data.name ?? "this request";

  const isBusiness = !!data.businessTitle || data.type === "business";
  const rows: Row[] = [];
  const add = (label: string, value: unknown, extra: Partial<Row> = {}) => {
    if (hasValue(value)) rows.push({ label, value: (value as string).trim(), ...extra });
  };
  if (data.fields) {
    for (const f of data.fields) {
      if (hasValue(f.value)) rows.push({ label: f.label, value: f.value.trim(), phone: f.phone });
      else if (f.always) rows.push({ label: f.label, value: "Not provided" });
    }
  } else if (isBusiness) {
    add("Business Title", data.businessTitle ?? data.name);
    add("Business Category", data.category);
    add("Description", data.description);
    add("Phone Number", data.phone, { phone: true });
    add("Business Number", data.businessPhone, { phone: true });
    add("Email Address", data.email);
    add("Complete Address", data.completeAddress);
  } else {
    add("Resident Name", data.name);
    add("Phone Number", data.phone, { phone: true });
    add("Email", data.email);
    add("Society", data.society);
    add("Address / Flat", [data.building, data.flatNo].filter(hasValue).join(", ") || data.completeAddress);
    add("Verification Details", data.ownerOrTenant ? capitalize(String(data.ownerOrTenant)) : undefined);
  }
  add("Status", data.status ? capitalize(String(data.status)) : undefined, { bold: true });
  rows.push({ label: "Request Date", value: formatRequestDate(data.requestDate) });
  const reportReasons = data?.report?.reason?.length ? joinWithComma(data.report.reason) : null;
  if (reportReasons) rows.push({ label: "People Reported", value: reportReasons });

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            maxHeight: Math.min(winH - Math.max(insets.top, 24) - 16, winH * 0.9),
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
            elevation: 16,
          }}
        >
          {/* Header — fixed while the details scroll */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#EEF0F2",
            }}
          >
            <Text style={{ fontSize: 19, fontFamily: "Manrope_700Bold", color: "#111827" }}>Details</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Close"
              hitSlop={8}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="close" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={{ flexGrow: 0, flexShrink: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 16 }}>
              <View style={{ gap: 12 }}>
                {data.fields ? (
                  <View style={{ alignItems: "center", marginBottom: 4 }}>
                    <UserAvatar uri={data.profileImage} name={data.businessTitle ?? data.name} userId={data.id} size={84} />
                  </View>
                ) : null}
                {/* Image Carousel */}
                {data.images &&
                  Array.isArray(data.images) &&
                  data.images.length > 1 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: "Manrope_600SemiBold",
                          marginBottom: 8,
                        }}
                      >
                        Business Images
                      </Text>
                      <View style={{ borderRadius: 12, overflow: "hidden" }}>
                        <ImageCarousel images={data.images} height={200} />
                      </View>
                    </View>
                  )}

                {/* Tabular Data */}
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Manrope_700Bold",
                    color: "#111827",
                    marginBottom: 10,
                  }}
                >
                  {isBusiness ? "Business Details" : "Resident Details"}
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 14,
                    overflow: "hidden",
                    marginBottom: 16,
                    backgroundColor: "#fff",
                  }}
                >
                  {/* Table Header */}
                  <View
                    style={{ flexDirection: "row", backgroundColor: "#F7F8FA", paddingHorizontal: 2 }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        padding: 10,
                        fontFamily: "Manrope_600SemiBold",
                        fontSize: 13,
                        color: "#6B7280",
                      }}
                    >
                      Field
                    </Text>
                    <Text
                      style={{
                        flex: 2,
                        padding: 10,
                        fontFamily: "Manrope_600SemiBold",
                        fontSize: 13,
                        color: "#6B7280",
                      }}
                    >
                      Value
                    </Text>
                  </View>
                  {/* Table Rows */}
                  {rows.map((r) => (
                    <View
                      key={r.label}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        borderTopWidth: 1,
                        borderTopColor: "#E5E7EB",
                      }}
                    >
                      <Text style={{ flex: 1, padding: 12, color: "#6B7280", fontSize: 13.5, fontFamily: "Manrope_500Medium" }}>{r.label}</Text>
                      <View style={{ flex: 2, flexDirection: "row", alignItems: "center", paddingRight: 10 }}>
                        <Text
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            paddingHorizontal: 4,
                            fontSize: 14,
                            color: "#111827",
                            flexShrink: 1,
                            ...(r.bold ? { fontFamily: "Manrope_600SemiBold" } : {}),
                          }}
                        >
                          {r.value}
                        </Text>
                        {r.phone ? (
                          <>
                            <TouchableOpacity
                              onPress={() => Linking.openURL(`tel:${r.value.replace(/\s/g, "")}`)}
                              style={{ marginRight: 12 }}
                              accessibilityLabel="Call"
                            >
                              <Ionicons name="call" size={20} color="#2563eb" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => Linking.openURL(whatsappUrl(r.value))}
                              accessibilityLabel="WhatsApp"
                            >
                              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                            </TouchableOpacity>
                          </>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>

                {data.documents && data.documents.length > 0 ? (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontFamily: "Manrope_700Bold", color: "#111827", marginBottom: 10 }}>
                      Submitted Documents
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                      {data.documents.map((d, i) => {
                        const isPdf = /\.pdf($|\?)/i.test(d.url);
                        return (
                          <TouchableOpacity
                            key={`${d.url}-${i}`}
                            onPress={() => (isPdf ? Linking.openURL(d.url) : setViewer(d.url))}
                            style={{ width: 96 }}
                            accessibilityLabel={`View ${d.label}`}
                          >
                            {isPdf ? (
                              <View style={{ width: 96, height: 96, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="document-text-outline" size={32} color="#6B7280" />
                              </View>
                            ) : (
                              <Image source={{ uri: d.url }} style={{ width: 96, height: 96, borderRadius: 12, backgroundColor: "#F3F4F6" }} />
                            )}
                            <Text style={{ marginTop: 6, fontSize: 12, color: "#6B7280", textAlign: "center" }} numberOfLines={2}>
                              {d.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {/* Price Table */}
                {data.price && (
                  <View style={{ marginTop: 8, marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Manrope_600SemiBold",
                        marginBottom: 8,
                      }}
                    >
                      Price Details
                    </Text>
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: "#E0E0E0",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      {/* Table Header */}
                      <View
                        style={{
                          flexDirection: "row",
                          backgroundColor: "#F3F4F6",
                        }}
                      >
                        <Text
                          style={{
                            flex: 1,
                            padding: 8,
                            fontFamily: "Manrope_600SemiBold",
                            fontSize: 14,
                          }}
                        >
                          MRP
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            padding: 8,
                            fontFamily: "Manrope_600SemiBold",
                            fontSize: 14,
                          }}
                        >
                          Discounted
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            padding: 8,
                            fontFamily: "Manrope_600SemiBold",
                            fontSize: 14,
                          }}
                        >
                          Selling
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            padding: 8,
                            fontFamily: "Manrope_600SemiBold",
                            fontSize: 14,
                          }}
                        >
                          % Off
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            padding: 8,
                            fontFamily: "Manrope_600SemiBold",
                            fontSize: 14,
                          }}
                        >
                          Save
                        </Text>
                      </View>
                      {/* Table Row */}
                      <View style={{ flexDirection: "row" }}>
                        <Text style={{ flex: 1, padding: 8, fontSize: 14 }}>
                          {data.price.mrp}
                        </Text>
                        <Text style={{ flex: 1, padding: 8, fontSize: 14 }}>
                          {data.price.discountPrcnt}
                        </Text>
                        <Text style={{ flex: 1, padding: 8, fontSize: 14 }}>
                          {data.price.sellingPrice}
                        </Text>
                        <Text style={{ flex: 1, padding: 8, fontSize: 14 }}>
                          {data.price.discountPrcnt}
                        </Text>
                        <Text style={{ flex: 1, padding: 8, fontSize: 14 }}>
                          {data.price.saveAmount}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {data.businessInfo && (
                <View style={{ gap: 12 }}>
                  <Text
                    style={{ fontSize: 16, fontFamily: "Manrope_600SemiBold", marginTop: 8 }}
                  >
                    Business Details
                  </Text>
                  <Field
                    label="Business Name"
                    value={data.businessInfo.businessName}
                  />
                  <Field label="Category" value={data.businessInfo.category} />
                  <Field
                    label="Description"
                    value={data.businessInfo.description}
                  />
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons — fixed below the scrolling content */}
          {(!data.status || data.status === "pending") && (
            <View
              style={{
                paddingTop: 12,
                paddingHorizontal: 20,
                paddingBottom: Math.max(insets.bottom, 12) + 4,
                borderTopWidth: 1,
                borderTopColor: "#EEF0F2",
                backgroundColor: "#fff",
                flexDirection: "row",
                gap: 12,
              }}
            >
              <ActionPill
                label="Reject"
                icon="close-circle-outline"
                bg="#FCE8E8"
                pressedBg="#F8D3D3"
                color="#C62828"
                disabled={isSubmitting}
                onPress={() => setConfirm("reject")}
              />
              <ActionPill
                label="Approve"
                icon="checkmark-circle-outline"
                bg="#E3F5E9"
                pressedBg="#CFEBD8"
                color="#16803C"
                disabled={isSubmitting}
                onPress={() => setConfirm("approve")}
              />
            </View>
          )}
          {confirm ? (
            <View
              style={{
                position: "absolute",
                left: 0, right: 0, top: 0, bottom: 0,
                backgroundColor: "rgba(15,23,42,0.45)",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
              }}
            >
              <View style={{ width: "100%", maxWidth: 380, backgroundColor: "#fff", borderRadius: 18, padding: 20 }}>
                <Text style={{ fontSize: 17, fontFamily: "Manrope_700Bold", color: "#111827" }}>
                  {confirm === "approve" ? "Approve request" : "Reject request"}
                </Text>
                <Text style={{ marginTop: 8, fontSize: 14, color: "#374151", fontFamily: "Manrope_600SemiBold" }} numberOfLines={2}>
                  {targetName}
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 20, color: "#6B7280" }}>
                  {confirm === "approve"
                    ? "Are you sure you want to approve this request?"
                    : "Are you sure you want to reject this request?"}
                </Text>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
                  <ActionPill
                    label="Cancel"
                    bg="#F3F4F6"
                    pressedBg="#E5E7EB"
                    color="#374151"
                    disabled={isSubmitting}
                    onPress={() => setConfirm(null)}
                    height={48}
                  />
                  <ActionPill
                    label="Confirm"
                    bg={confirm === "approve" ? "#E3F5E9" : "#FCE8E8"}
                    pressedBg={confirm === "approve" ? "#CFEBD8" : "#F8D3D3"}
                    color={confirm === "approve" ? "#16803C" : "#C62828"}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    onPress={confirm === "approve" ? handleApprove : handleReject}
                    height={48}
                  />
                </View>
              </View>
            </View>
          ) : null}
        </Pressable>
        {viewer ? (
          <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center" }}>
            <Image source={{ uri: viewer }} style={{ width: "100%", height: "80%" }} resizeMode="contain" />
            <TouchableOpacity
              onPress={() => setViewer(null)}
              accessibilityLabel="Close preview"
              style={{ position: "absolute", top: Math.max(insets.top, 16) + 8, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}
      </Pressable>
    </Modal>
  );
}
