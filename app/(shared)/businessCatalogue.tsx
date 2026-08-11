import { verificationStatus } from "@/assets/enums/common.enum";
import { BUSINESS_CAT_MOCK } from "@/assets/mocks/category";
import NoDataCard from "@/components/common/NoDataCard";
import BusinessForm from "@/components/form/BusinessForm";
import ActionButton from "@/components/inputs/ActionButton";
import FormSheetModal from "@/components/modals/FormSheetModal";
import { Card } from "@/components/UI/Card";
import { useProductStore } from "@/store/useBusinessStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BusinessCatalogue() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useUserStore((s) => s.user?._id);
  const userProducts = useProductStore((s) => s.userProducts);
  const getUserBusinesses = useProductStore((s) => s.getUserBusinesses);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const productLoading = useProductStore((s) => s.loading);
  const productError = useProductStore((s) => s.error);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 40 : 40);

  useEffect(() => {
    if (userId) {
      try {
        getUserBusinesses(userId);
      } catch (error) {
        console.error("Error fetching user businesses:", error);
      }
    }
  }, [userId, getUserBusinesses]);

  const openManage = useCallback((it: any) => {
    if (!it) return;
    setSelectedBusiness(it);
    setModalVisible(true);
  }, []);

  const closeManage = useCallback(() => {
    setModalVisible(false);
    setSelectedBusiness(null);
  }, []);

  const onSubmitBusiness = useCallback(
    async (data?: any) => {
      try {
        const id = selectedBusiness?._id as string | undefined;
        if (!id) {
          Alert.alert("Error", "Missing business id");
          return;
        }

        if (!selectedBusiness || !data) {
          Alert.alert("Error", "Missing required data");
          return;
        }

        const existingPrice = (selectedBusiness?.price as any) || {};
        const selling =
          data?.price != null
            ? String(data.price)
            : existingPrice?.sellingPrice || "";
        const mrp = existingPrice?.mrp || "";
        let discountPrcnt = existingPrice?.discountPrcnt || "";
        let saveAmount = existingPrice?.saveAmount || "";

        if (mrp && selling && !isNaN(Number(mrp)) && !isNaN(Number(selling))) {
          const mrpNum = Number(mrp);
          const sellNum = Number(selling);
          const discount = mrpNum > 0 ? ((mrpNum - sellNum) / mrpNum) * 100 : 0;
          discountPrcnt = discount.toFixed(2);
          saveAmount = (mrpNum - sellNum).toString();
        }

        const patch: any = {
          title: data?.title || selectedBusiness?.title || "",
          category: data?.category || selectedBusiness?.category || "",
          description: data?.description || selectedBusiness?.description || "",
          businessPhone:
            data?.businessPhone || selectedBusiness?.businessPhone || "",
          completeAddress:
            data?.address || selectedBusiness?.completeAddress || "",
          shopTimings: data?.shopTimings || selectedBusiness?.shopTimings || "",
          unit: data?.unit || selectedBusiness?.unit || "",
          images: Array.isArray(data?.images)
            ? data.images
            : selectedBusiness?.images || [],
          email: data?.email || selectedBusiness?.email || "",
          gstNumber: data?.gstNumber || selectedBusiness?.gstNumber || "",
          price: {
            mrp: mrp,
            sellingPrice: selling,
            discountPrcnt: discountPrcnt,
            saveAmount: saveAmount,
          },
        };

        Object.keys(patch).forEach(
          (k) => patch[k] === undefined && delete patch[k],
        );

        await updateProduct(patch, id);

        if (userId) {
          await getUserBusinesses(userId);
        }

        Alert.alert("Success", "Business updated successfully");
        closeManage();
      } catch (error) {
        console.error("Error updating business:", error);
        Alert.alert("Error", "Failed to update business. Please try again.");
      }
    },
    [selectedBusiness, userId, updateProduct, getUserBusinesses, closeManage],
  );

  const mapBusinessInitial = useCallback((it: any) => {
    if (!it) return undefined;
    return {
      title: it?.businessTitle || it?.name || it?.title || "",
      category: it?.category || "",
      description: it?.description || "",
      businessPhone: (it?.businessPhone || it?.phone || "").replace(
        /^\+91/,
        "",
      ),
      address: it?.address || it?.businessAddress || it?.completeAddress || "",
      unit: it?.unit || "",
      shopTimings: it?.shopTimings || "",
      email: it?.email || "",
      gstNumber: it?.gstNumber || "",
      price:
        typeof it?.price?.sellingPrice === "string"
          ? Number(it?.price?.sellingPrice) || 0
          : (it?.price?.sellingPrice ?? 0),
      images: Array.isArray(it?.images) ? it.images : [],
    } as any;
  }, []);

  const renderCatalogueItem = useCallback(({ item }: { item: any }) => {
    if (!item) return null;
    return (
      <Card style={{ marginBottom: 16, padding: 16, elevation: 2 }}>
        {/* Profile Section styled as per HTML reference */}
        <View style={styles.businessHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.businessHeading}>{item?.title}</Text>
            <Text style={styles.businessDesc}>{item?.description}</Text>
          </View>
          <Pressable
            onPress={() => openManage(item)}
            style={{ marginLeft: 8, padding: 6, borderRadius: 20 }}
            android_ripple={{ color: "#F97316", borderless: true }}
            // hitSlop={8}
            disabled={
              item?.verificationStatus.status === verificationStatus.PENDING
            }
          >
            <Ionicons name="pencil" size={16} color="#F97316" />
          </Pressable>
        </View>
        {item?.verificationStatus.status === verificationStatus.PENDING && (
          <Text style={{ color: "#D97706", marginBottom: 8 }}>
            Your business verification is pending. Some actions may be disabled.
          </Text>
        )}
        <View style={styles.buttonGridRow}>
          <ActionButton
            title="Manage"
            onPress={() =>
              router.navigate(`/(shared)/businessList?id=${item._id}&edit=true`)
            }
            variant="outline"
            fullWidth
            disabled={
              item?.verificationStatus.status === verificationStatus.PENDING
            }
            containerStyle={styles.manageButton}
            textStyle={styles.manageButtonText}
          />
          <ActionButton
            title="View Catalog"
            onPress={() =>
              router.navigate(
                `/(shared)/businessList?id=${item._id}&edit=false`,
              )
            }
            fullWidth
            disabled={
              item?.verificationStatus.status === verificationStatus.PENDING
            }
            containerStyle={styles.ctaButton}
            textStyle={styles.ctaButtonText}
          />
        </View>
      </Card>
    );
  }, []);
  return (
    <View
      style={{
        paddingTop: topPadding,
        flex: 1,
        backgroundColor: t.colors.background,
      }}
    >
      {/* Fixed Header (non-scrollable) */}
      <Text style={styles.pageHeading}>My Catalogue List</Text>
      <View>
        <FlatList
          data={userProducts}
          keyExtractor={(item, index) => item._id ?? String(index)}
          renderItem={renderCatalogueItem}
          ListEmptyComponent={
            <NoDataCard
              iconName="reader-outline"
              message="No Results Found"
              subText="You have not added any products to your catalogue yet."
            />
          }
          contentContainerStyle={{ padding: 16 }}
          removeClippedSubviews
          windowSize={5}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <FormSheetModal
        visible={modalVisible}
        onClose={closeManage}
        title="Edit Business"
        subtitle={selectedBusiness?.title || ""}
        scroll={false}
      >
        <BusinessForm
          categories={BUSINESS_CAT_MOCK || []}
          initialData={mapBusinessInitial(selectedBusiness)}
          onSubmit={onSubmitBusiness}
          submitLabel="Update Business"
          loading={productLoading || false}
          error={productError || null}
        />
      </FormSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  businessHeading: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#22223B",
  },
  businessDesc: {
    color: "#4B5563", // text-gray-600
    fontSize: 15,
    marginBottom: 16,
  },
  businessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonGridRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  manageButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 6,
  },
  manageButtonText: {
    color: "#22223B",
    fontWeight: "600",
    fontSize: 16,
  },
  ctaButton: {
    flex: 1,
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 6,
  },
  ctaButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  pageHeading: {
    fontWeight: "bold",
    fontSize: 24,
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    margin: 16,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: "#22223B",
    marginBottom: 8,
  },
  bold: {
    fontWeight: "700",
  },
  desc: {
    color: "#475467",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  previewButton: {
    flex: 1,
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
});
