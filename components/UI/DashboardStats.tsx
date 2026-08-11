import { useTheme } from "@/theme/theme";
import { DashboardStatsProps } from "@/types/common.type";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Card } from "./Card";

export default function DashboardStats({
  firstIconName,
  firstCount,
  firstLabel,
  secondIconName,
  secondCount,
  secondLabel,
}: DashboardStatsProps) {
  const t = useTheme();
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card
          style={{
            flex: 1,
            padding: 16,
            alignItems: "center",
            backgroundColor: t.colors.surface,
          }}
        >
          <Ionicons name={firstIconName} size={24} color={t.colors.primary} />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              marginTop: 8,
              color: t.colors.textPrimary,
            }}
          >
            {firstCount}
          </Text>
          <Text
            style={{
              fontSize: 12,
              marginTop: 4,
              color: t.colors.textSecondary,
            }}
          >
            {firstLabel}
          </Text>
        </Card>
        <Card
          style={{
            flex: 1,
            padding: 16,
            alignItems: "center",
            backgroundColor: t.colors.surface,
          }}
        >
          <Ionicons name={secondIconName} size={24} color="#4CAF50" />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              marginTop: 8,
              color: t.colors.textPrimary,
            }}
          >
            {secondCount}
          </Text>
          <Text
            style={{
              fontSize: 12,
              marginTop: 4,
              color: t.colors.textSecondary,
            }}
          >
            {secondLabel}
          </Text>
        </Card>
      </View>
    </View>
  );
}