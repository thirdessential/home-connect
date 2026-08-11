import { Card } from "@/components/UI/Card";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  isSelected?: boolean;
  type?: "pending" | "approved";
}

const StatsCard = memo(
  ({
    title,
    value,
    icon,
    onPress,
    isSelected = false,
    type = "approved",
  }: StatsCardProps) => {
    const theme = useTheme();

    // Determine background and border colors based on selection and type
    const backgroundColor = isSelected
      ? type === "pending"
        ? "#FEF2F2"
        : "#F0FDF4"
      : "white";

    const borderColor = isSelected
      ? type === "pending"
        ? "#DC2626"
        : "#16A34A"
      : "black";

    const CardContent = () => (
      <Card
        style={{
          flex: 1,
          flexGrow: 1,
          minWidth: 140,
          backgroundColor: backgroundColor,
          borderRadius: 16,
          padding: 20,
          elevation: 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          borderWidth: isSelected ? 2 : 0,
          borderColor: borderColor,
        }}
      >
        <View
          style={{
            flexDirection: "column",
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                lineHeight: 20,
                fontWeight: "600",
                color: borderColor,
                flex: 1,
                paddingRight: 8,
              }}
              numberOfLines={2}
            >
              {title}
            </Text>
            <Ionicons name={icon} size={32} color={borderColor} />
          </View>
          <Text
            style={{
              fontSize: 32,
              lineHeight: 40,
              fontWeight: "700",
              color: theme.colors.textPrimary,
            }}
          >
            {value}
          </Text>
        </View>
      </Card>
    );

    return onPress ? (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <CardContent />
      </TouchableOpacity>
    ) : (
      <CardContent />
    );
  }
);

StatsCard.displayName = "StatsCard";

export default StatsCard;
