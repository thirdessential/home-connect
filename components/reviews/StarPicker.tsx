import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../theme/theme";

export default function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const t = useTheme();
  return (
    <View className="flex-row items-center mb-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            className="mr-2"
          >
            <Text
              style={{
                fontSize: 30,
                color: active ? t.colors.warning : t.colors.textSecondary,
              }}
            >
              ★
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
