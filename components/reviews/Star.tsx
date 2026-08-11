import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useTheme } from "../../theme/theme";

export default function Stars({ value }: { value: number }) {
  const t = useTheme();
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rounded ? "star" : "star-outline"}
          size={16}
          color={n <= rounded ? t.colors.warning : t.colors.textSecondary}
        />
      ))}
    </View>
  );
}
