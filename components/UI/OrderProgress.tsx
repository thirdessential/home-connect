import { useTheme } from "@/theme/theme";
import { Text, View } from "react-native";

function OrderProgressBar({
  current,
  total,
  showLabel = false,
}: {
  current: number;
  total: number;
  showLabel?: boolean;
}) {
  const t = useTheme();
  const percent = total > 0 ? (current / total) * 100 : 0;
  return (
    <View className="mb-3">
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            height: 8,
            borderRadius: 3,
            backgroundColor: t.colors.surfaceAlt,
            overflow: "hidden",
            marginTop: 4,
          }}
        >
          <View
            style={{
              width: `${percent}%`,
              height: "100%",
              backgroundColor: t.colors.primary,
              borderRadius: 3,
            }}
          />
        </View>
        {showLabel && (
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: t.colors.textSecondary,
              marginTop: 4,
            }}
          >
            {current} / {total}
          </Text>
        )}
      </View>
    </View>
  );
}
export default OrderProgressBar;
