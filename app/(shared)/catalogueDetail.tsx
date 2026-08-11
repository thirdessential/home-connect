import ActionButton from "@/components/inputs/ActionButton";
import ImageCarousel from "@/components/UI/ImageCarousel";
import { useProductStore } from "@/store/useBusinessStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Gallery theme colors (from HTML reference)
const GALLERY_THEME = {
  bg: "#FDFBF8",
  text: "#382A22",
  accent: "#D97706",
  cardBg: "#FFFFFF",
  headerBg: "rgba(253, 251, 248, 0.85)",
  borderColor: "rgba(56, 42, 34, 0.1)",
};

// Memoized spec row component
function SpecRowComponent({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const SpecRow = React.memo(SpecRowComponent);

export default function CatalogueDetail() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    catalogueId?: string;
    businessId?: string;
  }>();
  const catalogueId = params.catalogueId as string | undefined;

  const product = useProductStore((s) => s.product);
  const catalogueList = product?.catalogue;

  // Find the specific catalogue item
  const catalogueItem = useMemo(() => {
    if (!catalogueList || !catalogueId) return null;
    return catalogueList.find((item) => item._id === catalogueId) || null;
  }, [catalogueList, catalogueId]);

  const topPadding = useMemo(
    () => Math.max(insets.top, Platform.OS === "ios" ? 44 : 24),
    [insets.top]
  );

  const bottomPadding = useMemo(
    () => Math.max(insets.bottom, 24),
    [insets.bottom]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleOrderEnquire = useCallback(() => {
    // TODO: Implement order/enquire functionality
  }, []);

  // Memoized specifications
  const specifications = useMemo(() => {
    if (!catalogueItem) return [];
    const specs: { label: string; value: string }[] = [];

    if (catalogueItem.unit) {
      specs.push({ label: "Unit", value: catalogueItem.unit });
    }
    if (catalogueItem.itemType) {
      specs.push({ label: "Type", value: catalogueItem.itemType });
    }
    if (catalogueItem.inStock) {
      specs.push({ label: "Stock Status", value: catalogueItem.inStock });
    }
    if (catalogueItem.rating) {
      specs.push({ label: "Rating", value: `${catalogueItem.rating} ⭐` });
    }

    return specs;
  }, [catalogueItem]);

  if (!catalogueItem) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={GALLERY_THEME.text}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Item not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={GALLERY_THEME.text} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <ImageCarousel
            images={catalogueItem.images || []}
            height={width}
            borderRadius={0}
            showDots={true}
            contentFit="cover"
          />
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Title & Price */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{catalogueItem.title}</Text>
            <Text style={styles.price}>
              {catalogueItem.itemType === "quote"
                ? "Custom Price"
                : `₹${catalogueItem.price}`}
            </Text>
          </View>

          {/* Description / Artist's Note */}
          {catalogueItem.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.artistNote}>{catalogueItem.description}</Text>
            </View>
          )}

          {/* Specifications */}
          {specifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <View style={styles.specsContainer}>
                {specifications.map((spec, index) => (
                  <SpecRow key={index} label={spec.label} value={spec.value} />
                ))}
              </View>
            </View>
          )}

          {/* Tags */}
          {catalogueItem.tags && catalogueItem.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {catalogueItem.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Footer CTA */}
      <View style={[styles.footer, { paddingBottom: bottomPadding }]}>
        <ActionButton
          title="Order or Enquire"
          onPress={handleOrderEnquire}
          fullWidth
          containerStyle={styles.ctaButton}
          textStyle={styles.ctaButtonText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GALLERY_THEME.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: GALLERY_THEME.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: GALLERY_THEME.borderColor,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 999,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  carouselContainer: {
    width: "100%",
  },
  contentSection: {
    paddingHorizontal: 16,
  },
  titleSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: GALLERY_THEME.borderColor,
  },
  title: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 28,
    fontWeight: "700",
    color: GALLERY_THEME.text,
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    color: GALLERY_THEME.text,
    opacity: 0.9,
  },
  section: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: GALLERY_THEME.borderColor,
  },
  sectionTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 20,
    fontWeight: "700",
    color: GALLERY_THEME.text,
    marginBottom: 12,
  },
  artistNote: {
    fontSize: 16,
    lineHeight: 24,
    color: GALLERY_THEME.text,
    opacity: 0.9,
    fontStyle: "italic",
  },
  specsContainer: {
    gap: 8,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  specLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: GALLERY_THEME.text,
    opacity: 0.6,
  },
  specValue: {
    flex: 2,
    fontSize: 15,
    color: GALLERY_THEME.text,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "rgba(217, 119, 6, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 14,
    color: GALLERY_THEME.accent,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GALLERY_THEME.bg,
    borderTopWidth: 1,
    borderTopColor: GALLERY_THEME.borderColor,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  ctaButton: {
    backgroundColor: GALLERY_THEME.accent,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    color: GALLERY_THEME.bg,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: GALLERY_THEME.text,
    opacity: 0.6,
  },
});
