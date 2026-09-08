import { WHOLESALE_DEALS_CAT } from "@/assets/mocks/category";
import FilterChips from "@/components/common/FilterChips";
import NoDataCard from "@/components/common/NoDataCard";
import ProductCard from "@/components/product/ProductCard";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import { useMemo, useState } from "react";
import { FlatList, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DealsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const productList = useWholesaleDealStore((state) => state.activeDeals);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  // console.log("productList", JSON.stringify(productList, null, 4))

  // All other deals
  const filteredBusinesses = useMemo(() => {
    if (!selectedCat || selectedCat === "all") return productList ?? [];
    return (productList ?? []).filter((b) =>
      Array.isArray(b.category)
        ? b.category.includes(selectedCat)
        : b.category === selectedCat
    );
  }, [productList, selectedCat]);

  // Calculate top padding based on safe area insets and platform
  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 40 : 40);

  return (
    <View
      style={{
        paddingTop: topPadding,
        flex: 1,
        backgroundColor: t.colors.background,
      }}
    >
      {/* Fixed Header (non-scrollable) */}
      <Text style={{ fontWeight: "bold", fontSize: 24, padding: 16 }}>
        Community Deals
      </Text>

      {/* Deals feature not live yet — content/API list hidden until launch */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <Text style={{ fontWeight: "700", fontSize: 20, color: t.colors.textPrimary, marginBottom: 8 }}>
          Coming Soon
        </Text>
        <Text style={{ fontSize: 14, color: t.colors.textSecondary, textAlign: "center" }}>
          Deals are coming soon to Home Connect.
        </Text>
      </View>
    </View>
  );
}
