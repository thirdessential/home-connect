import { useSocietyStore } from "@/store/useSocietyStore";
import { useTheme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function SocietyHeader() {
  const t = useTheme();
  const router = useRouter();
  const { selectedSociety } = useSocietyStore();

  const handleSocietyPress = useCallback(() => {
    router.push("/onboarding/select-society");
  }, [router]);

  return (
    <View
      style={{ paddingHorizontal: t.spacing.l, paddingVertical: t.spacing.m }}
    >
      {/* Header with Society Name */}
      <View style={{ marginBottom: t.spacing.m }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "500",
            color: t.colors.textSecondary,
            marginBottom: t.spacing.xs,
            letterSpacing: 0.5,
          }}
        >
          YOUR SOCIETY
        </Text>

        <TouchableOpacity
          onPress={handleSocietyPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {selectedSociety?.name || "Select Society"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={24}
            color={t.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
