import { useTheme } from "@/theme/theme";
import { Stack } from "expo-router";

export default function SharedLayout() {
  const t = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: t.colors.white,
        },
        headerTintColor: t.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: t.colors.white,
        },
      }}
    >
    </Stack>
  );
}
