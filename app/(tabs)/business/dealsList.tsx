import { Card } from "@/components/UI/Card";
import ImageCarousel from "@/components/UI/ImageCarousel";
import ActionButton from "@/components/inputs/ActionButton";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import { WholesaleDeal } from "@/types/business.type";
import { router } from "expo-router";
import { useMemo } from "react";
import { Image, ScrollView, Text, View } from "react-native";

export default function DealsListScreen() {
  const t = useTheme();
  const { deals, loading } = useWholesaleDealStore();

  const filteredDeals = useMemo(() => {
    return deals ?? [];
  }, [deals]);

  // Helper: is deal closing within 24 hours?
  const isClosingSoon = (deadlineStr?: string): boolean => {
    if (!deadlineStr) return false;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {loading && (
          <Text
            style={{
              textAlign: "center",
              color: "#64748B",
              marginVertical: 20,
            }}
          >
            Loading...
          </Text>
        )}
        {(!filteredDeals || filteredDeals.length === 0) && !loading && (
          <Text
            style={{
              textAlign: "center",
              color: "#F43F5E",
              marginVertical: 20,
              fontWeight: "600",
            }}
          >
            No deals available.
          </Text>
        )}
        {filteredDeals &&
          filteredDeals.map((deal: WholesaleDeal) => {
            const creator =
              typeof (deal as any).userId === "object" &&
                (deal as any).userId !== null
                ? (deal as any).userId
                : null;
            const closingSoon = isClosingSoon((deal as any).orderDeadlineDate);
            const dealStatus = (deal as any).dealStatus || "ACTIVE";
            const isComingSoon = dealStatus === "COMING_SOON";

            return (
              <Card
                key={deal._id}
                style={{
                  marginBottom: 16,
                  padding: 18,
                  borderRadius: 12,
                  backgroundColor: t.colors.lightBackground,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {/* Closing Soon Badge */}
                {closingSoon && !isComingSoon && (
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: "#F97316",
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      🔥 Closing Soon
                    </Text>
                  </View>
                )}

                {/* Coming Soon Badge */}
                {isComingSoon && (
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: "#7C3AED",
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      🕐 Coming Soon
                    </Text>
                  </View>
                )}

                {/* Image Carousel */}
                {deal.images && deal.images.length > 0 && (
                  <View
                    style={{
                      borderRadius: 10,
                      overflow: "hidden",
                      marginBottom: 10,
                    }}
                  >
                    <ImageCarousel images={deal.images} height={180} />
                  </View>
                )}

                {/* Deal Title */}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: t.colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  {deal.title}
                </Text>

                {/* Creator Info */}
                {creator && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    {creator.profilePhotoUrl ? (
                      <Image
                        source={{ uri: creator.profilePhotoUrl }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          marginRight: 8,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: t.colors.primary,
                          marginRight: 8,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: "700",
                          }}
                        >
                          {(creator.fullName || "U")[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={{
                        fontSize: 13,
                        color: t.colors.textSecondary,
                        fontWeight: "500",
                      }}
                    >
                      {creator.fullName || "Unknown Seller"}
                    </Text>
                  </View>
                )}

                <Text
                  style={{ fontSize: 14, color: "#64748B", marginBottom: 10 }}
                >
                  {deal.description}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#334155" }}>
                    MRP:
                  </Text>
                  <Text style={{ color: "#0F172A", fontWeight: "500" }}>
                    {deal.price?.mrp}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#334155" }}>
                    Deal Price:
                  </Text>
                  <Text style={{ color: "#0F172A", fontWeight: "500" }}>
                    {deal.price?.sellingPrice}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#334155" }}>
                    Unit:
                  </Text>
                  <Text style={{ color: "#0F172A", fontWeight: "500" }}>
                    {deal.quantityUnit}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#334155" }}>
                    Min Order:
                  </Text>
                  <Text style={{ color: "#0F172A", fontWeight: "500" }}>
                    {deal.minimumOrderQty}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#334155" }}>
                    Max Order:
                  </Text>
                  <Text style={{ color: "#0F172A", fontWeight: "500" }}>
                    {deal.maximumOrderQty}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#334155" }}>
                    Deadline:
                  </Text>
                  <Text
                    style={{
                      color: closingSoon ? "#F97316" : "#0F172A",
                      fontWeight: closingSoon ? "700" : "500",
                    }}
                  >
                    {(deal as any).orderDeadlineDate}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#334155" }}>
                    Delivery:
                  </Text>
                  <Text style={{ color: "#0F172A", fontWeight: "500" }}>
                    {deal.estimatedDeliveryDate}
                  </Text>
                </View>

                {/* Deal Status Badge */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#334155" }}>
                    Status:
                  </Text>
                  <View
                    style={{
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      backgroundColor:
                        dealStatus === "UNLOCKED"
                          ? "#D1FAE5"
                          : dealStatus === "UNLOCKING"
                            ? "#FEF3C7"
                            : dealStatus === "FULL"
                              ? "#E0E7FF"
                              : dealStatus === "FAILED"
                                ? "#FEE2E2"
                                : dealStatus === "CANCELLED"
                                  ? "#F1F5F9"
                                  : dealStatus === "CLOSING_SOON"
                                    ? "#F1F5F9"
                                    : dealStatus === "COMING_SOON"
                                      ? "#EDE9FE"
                                      : "#DBEAFE",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        fontSize: 12,
                        color:
                          dealStatus === "UNLOCKED"
                            ? "#10B981"
                            : dealStatus === "UNLOCKING"
                              ? "#D97706"
                              : dealStatus === "FULL"
                                ? "#6366F1"
                                : dealStatus === "FAILED"
                                  ? "#EF4444"
                                  : dealStatus === "CANCELLED"
                                    ? "#94A3B8"
                                    : dealStatus === "COMING_SOON"
                                      ? "#7C3AED"
                                      : "#3B82F6",
                      }}
                    >
                      {dealStatus}
                    </Text>
                  </View>
                </View>

                {/* View Deal CTA */}
                <ActionButton
                  title="View Deal"
                  onPress={() => {
                    router.navigate(
                      `/(shared)/${deal._id}?flow=deal&id=${deal._id}`
                    );
                  }}
                  containerStyle={{
                    marginTop: 12,
                    borderRadius: 8,
                    backgroundColor: t.colors.primary,
                  }}
                  textStyle={{ color: "#fff", fontWeight: "700" }}
                />
              </Card>
            );
          })}
      </ScrollView>
    </View>
  );
}


