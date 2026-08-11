import { formatDate } from "@/lib/dateTime";
import { capitalizeWords } from "@/lib/utils";
import { useTheme } from "@/theme/theme";
import { Product } from "@/types/business.type";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface ProductDetailsProps {
  product: Product | null;
  containerStyle?: any;
}

export default function ProductDetails({
  product,
  containerStyle,
}: ProductDetailsProps) {
  const t = useTheme();

  return (
    <View style={[{ marginVertical: 16 }, containerStyle]}>
      <Text
        className="mb-3 font-bold"
        style={{ color: t.colors.textPrimary, fontSize: 18 }}
      >
        Product Details
      </Text>

      {/* 2x2 Grid for Basic Details */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          {/* Column 1: Category */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={{
                color: t.colors.textSecondary,
                marginBottom: 4,
                fontSize: 12,
              }}
            >
              Category
            </Text>
            <Text
              style={{
                color: t.colors.textPrimary,
                fontWeight: "500",
              }}
            >
              {capitalizeWords(product?.category || "General")}
            </Text>
          </View>

          {/* Column 2: Unit */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: t.colors.textSecondary,
                marginBottom: 4,
                fontSize: 12,
              }}
            >
              Posted On
            </Text>
            <Text
              style={{
                color: t.colors.textPrimary,
                fontWeight: "500",
              }}
            >
              {product?.createdAt ? formatDate(product.createdAt) : ""}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row" }}>
          {/* Column 1: MRP */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={{
                color: t.colors.textSecondary,
                marginBottom: 4,
                fontSize: 12,
              }}
            >
              MRP
            </Text>
            <Text
              style={{
                color: t.colors.textSecondary,
                fontWeight: "500",
                textDecorationLine: "line-through",
              }}
            >
              {"₹"} {product?.price?.mrp || "0"}
            </Text>
          </View>

          {/* Column 2: Deal Price */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: t.colors.textSecondary,
                marginBottom: 4,
                fontSize: 12,
              }}
            >
              Deal Price
            </Text>
            <Text
              style={{
                color: t.colors.primary,
                fontWeight: "600",
              }}
            >
              {"₹"} {product?.price?.sellingPrice || "0"}
            </Text>
          </View>
        </View>
      </View>

      {/* 2x2 Grid for Additional Details */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          {/* Column 1: Min Order */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={{
                color: t.colors.textSecondary,
                marginBottom: 4,
                fontSize: 12,
              }}
            >
              You saved
            </Text>
            <Text
              style={{
                color: t.colors.textPrimary,
                fontWeight: "500",
              }}
            >
              {"₹"} {product && product?.price?.saveAmount}
            </Text>
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={{
                color: t.colors.textSecondary,
                marginBottom: 4,
                fontSize: 12,
              }}
            >
              Cash on Delivery
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#4CAF50"
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  color: "#4CAF50",
                  fontWeight: "500",
                }}
              >
                {"Not Available"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}