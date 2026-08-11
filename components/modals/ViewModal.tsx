import ImageCarousel from "@/components/UI/ImageCarousel";
import { formatDate } from "@/lib/dateTime";
import { useTheme } from "@/theme/theme";
import { ProductPrice } from "@/types/business.type";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { joinWithComma } from "@/lib/utils";
import CircularImage from "../form/CircularImage";
import ActionButton from "../inputs/ActionButton";
import TextArea from "../inputs/TextArea";

interface ViewModalProps {
  visible: boolean;
  onClose: () => void;
  onApprove?: () => Promise<void>;
  onReject?: (reason: string) => Promise<void>;
  data: {
    id: string;
    name?: string;
    businessTitle?: string;
    email?: string;
    phone: string;
    building?: string;
    businessPhone?: string;
    flatNo?: string;
    status?: string;
    requestDate: string;
    description?: string;
    completeAddress?: string;
    category?: string;
    images?: string[];
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

export default function ViewModal({
  visible,
  onClose,
  onApprove,
  onReject,
  data,
}: ViewModalProps) {
  const t = useTheme();
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = () => {
    if (!onApprove) return;
    setIsSubmitting(true);
    try {
      onApprove();
      onClose(); // Close modal after successful approval
    } catch (error) {
      console.error("Error approving request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    if (!onReject || !rejectionReason.trim()) return;
    setIsSubmitting(true);
    try {
      onReject(rejectionReason.trim());
      setIsRejecting(false);
      setRejectionReason("");
      onClose(); // Close modal after successful rejection
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View
          style={{
            flex: 1,
            marginTop: 100,
            backgroundColor: "white",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#E0E0E0",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
          >
            <View style={{ gap: 16 }}>
              <View style={{ gap: 12 }}>
                {data.type === "resident" ||
                  (data.type === "daily-helper" && (
                    <View className="items-center mb-6">
                      <CircularImage
                        uri={data.images?.[0] ?? undefined}
                        mode="view"
                        onChange={(uri) => { }}
                        size={120}
                        loading={false}
                      />
                    </View>
                  ))}
                {/* Image Carousel */}
                {data.images &&
                  Array.isArray(data.images) &&
                  data.images.length > 1 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
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
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Product Details
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: "#E0E0E0",
                    borderRadius: 8,
                    overflow: "hidden",
                    marginBottom: 16,
                  }}
                >
                  {/* Table Header */}
                  <View
                    style={{ flexDirection: "row", backgroundColor: "#F3F4F6" }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        padding: 8,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      Field
                    </Text>
                    <Text
                      style={{
                        flex: 2,
                        padding: 8,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      Value
                    </Text>
                  </View>
                  {/* Table Rows */}
                  {data.name && (
                    <View
                      style={{
                        flexDirection: "row",
                        borderTopWidth: 1,
                        borderTopColor: "#E0E0E0",
                      }}
                    >
                      <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                        Full Name
                      </Text>
                      <Text style={{ flex: 2, padding: 8 }}>{data.name}</Text>
                    </View>
                  )}
                  {data.businessTitle && (
                    <View
                      style={{
                        flexDirection: "row",
                        borderTopWidth: 1,
                        borderTopColor: "#E0E0E0",
                      }}
                    >
                      <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                        Business Title
                      </Text>
                      <Text style={{ flex: 2, padding: 8 }}>
                        {data.businessTitle}
                      </Text>
                    </View>
                  )}
                  {data.description && (
                    <View
                      style={{
                        flexDirection: "row",
                        borderTopWidth: 1,
                        borderTopColor: "#E0E0E0",
                      }}
                    >
                      <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                        Description
                      </Text>
                      <Text style={{ flex: 2, padding: 8 }}>
                        {data.description}
                      </Text>
                    </View>
                  )}
                  {data.email && (
                    <View
                      style={{
                        flexDirection: "row",
                        borderTopWidth: 1,
                        borderTopColor: "#E0E0E0",
                      }}
                    >
                      <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                        Email Address
                      </Text>
                      <Text style={{ flex: 2, padding: 8 }}>{data.email}</Text>
                    </View>
                  )}
                  {data.category && (
                    <View
                      style={{
                        flexDirection: "row",
                        borderTopWidth: 1,
                        borderTopColor: "#E0E0E0",
                      }}
                    >
                      <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                        Business Category
                      </Text>
                      <Text style={{ flex: 2, padding: 8 }}>
                        {data.category}
                      </Text>
                    </View>
                  )}
                  {data.phone && (
                    <View
                      style={{
                        flexDirection: "row",
                        borderTopWidth: 1,
                        borderTopColor: "#E0E0E0",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                        Phone Number
                      </Text>
                      <View
                        style={{
                          flex: 2,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ flex: 1, padding: 8 }}>
                          {data.phone}
                        </Text>
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`tel:${data.phone}`)}
                          style={{ marginRight: 8 }}
                        >
                          <Ionicons name="call" size={20} color="#2563eb" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(`https://wa.me/${data.phone}`)
                          }
                        >
                          <Ionicons
                            name="logo-whatsapp"
                            size={20}
                            color="#25D366"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {data.businessPhone && (
                    <View
                      style={{
                        flexDirection: "row",
                        borderTopWidth: 1,
                        borderTopColor: "#E0E0E0",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                        Business Number
                      </Text>
                      <View
                        style={{
                          flex: 2,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ flex: 1, padding: 8 }}>
                          {data.businessPhone}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(`tel:${data.businessPhone}`)
                          }
                          style={{ marginRight: 8 }}
                        >
                          <Ionicons name="call" size={20} color="#2563eb" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(
                              `https://wa.me/${data.businessPhone}`
                            )
                          }
                        >
                          <Ionicons
                            name="logo-whatsapp"
                            size={20}
                            color="#25D366"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {data.completeAddress && (
                    <View
                      style={{
                        flexDirection: "row",
                        borderTopWidth: 1,
                        borderTopColor: "#E0E0E0",
                      }}
                    >
                      <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                        Complete Address
                      </Text>
                      <Text style={{ flex: 2, padding: 8 }}>
                        {data.completeAddress}
                      </Text>
                    </View>
                  )}
                  {data.building && data.flatNo && (
                    <View
                      style={{
                        flexDirection: "row",
                        borderTopWidth: 1,
                        borderTopColor: "#E0E0E0",
                      }}
                    >
                      <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                        Building
                      </Text>
                      <Text
                        style={{ flex: 2, padding: 8 }}
                      >{`Building - ${data.building}, Flat - ${data.flatNo}`}</Text>
                    </View>
                  )}
                  {data.status && (
                    <View
                      style={{
                        flexDirection: "row",
                        borderTopWidth: 1,
                        borderTopColor: "#E0E0E0",
                      }}
                    >
                      <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                        Status
                      </Text>
                      <Text
                        style={{ flex: 2, padding: 8, fontWeight: "600" }}
                      >{`${data.status}`}</Text>
                    </View>
                  )}
                  {data?.report &&
                    data.report.reason &&
                    data.report.reason.length > 0 && (
                      <View
                        style={{
                          flexDirection: "row",
                          borderTopWidth: 1,
                          borderTopColor: "#E0E0E0",
                        }}
                      >
                        <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                          People Reported
                        </Text>
                        <Text style={{ flex: 2, padding: 8 }}>
                          {joinWithComma(data.report.reason)}
                        </Text>
                      </View>
                    )}
                  <View
                    style={{
                      flexDirection: "row",
                      borderTopWidth: 1,
                      borderTopColor: "#E0E0E0",
                    }}
                  >
                    <Text style={{ flex: 1, padding: 8, color: "#666" }}>
                      Request Date
                    </Text>
                    <Text style={{ flex: 2, padding: 8 }}>
                      {formatDate(data.requestDate)}
                    </Text>
                  </View>
                </View>

                {/* Price Table */}
                {data.price && (
                  <View style={{ marginTop: 8, marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
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
                            fontWeight: "600",
                            fontSize: 14,
                          }}
                        >
                          MRP
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            padding: 8,
                            fontWeight: "600",
                            fontSize: 14,
                          }}
                        >
                          Discounted
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            padding: 8,
                            fontWeight: "600",
                            fontSize: 14,
                          }}
                        >
                          Selling
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            padding: 8,
                            fontWeight: "600",
                            fontSize: 14,
                          }}
                        >
                          % Off
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            padding: 8,
                            fontWeight: "600",
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
                    style={{ fontSize: 16, fontWeight: "600", marginTop: 8 }}
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

          {/* Action Buttons */}
          {data.status === "pending" && (
            <View
              style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: "#E0E0E0",
              }}
            >
              {isRejecting ? (
                <View style={{ gap: 12 }}>
                  <TextArea
                    label="Reason for rejection"
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    lines={3}
                    maxLength={300}
                    containerStyle={{ marginBottom: 16 }}
                  />
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <ActionButton
                      title="Cancel"
                      onPress={() => {
                        setIsRejecting(false);
                        setRejectionReason("");
                      }}
                      variant="secondary"
                      containerStyle={{ flex: 1 }}
                    />
                    <ActionButton
                      title="Confirm Reject"
                      onPress={handleReject}
                      variant="danger"
                      loading={isSubmitting}
                      disabled={!rejectionReason.trim() || isSubmitting}
                      containerStyle={{ flex: 1 }}
                    />
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <ActionButton
                    title="Reject"
                    onPress={() => setIsRejecting(true)}
                    variant="danger"
                    containerStyle={{ flex: 1 }}
                    disabled={isSubmitting}
                  />
                  <ActionButton
                    title="Approve"
                    onPress={handleApprove}
                    variant="primary"
                    containerStyle={{ flex: 1 }}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
