import { ProductCarouselProps } from "@/types/common.type";
import { Dimensions, FlatList, Pressable, View } from "react-native";
import ProductCard from "../product/ProductCard";

const { width } = Dimensions.get("window");
const CARD_W = Math.round(width * 0.72);
const SPACING = 14;
const SIDE_PAD = 0;

export default function ProductCarousel({
  products,
  onPressProductItem,
  ctaName,
  style,
  loading,
}: ProductCarouselProps) {
  const filteredProducts = products; // No filtering, show all products

  return (
    <View style={[style]}>
      <FlatList
        data={filteredProducts as any[]} // Use filtered products here and cast to any[]
        keyExtractor={(x) => x._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={{
          margin: 4,
          marginBottom: 0,
          paddingLeft: SIDE_PAD,
          paddingRight: SIDE_PAD - SPACING, // margin at end
        }}
        renderItem={({ item }) => (
          <Pressable onPress={() => onPressProductItem(item._id)}>
            <ProductCard
              productDetails={item}
              style={{ width: CARD_W, marginRight: SPACING }}
              loading={loading}
            />
          </Pressable>
        )}
      />
    </View>
  );
}
