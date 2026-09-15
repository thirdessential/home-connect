// Full-screen Delete Account flow (not a bottom sheet), pushed from
// my-profiles.tsx. Mirrors the header pattern used by my-reports.tsx.
import TitleHeader from "@/components/UI/TitleHeader";
import DeleteAccount from "@/components/profile/DeleteAccount";
import { useTheme } from "@/theme/theme";
import { router } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DeleteAccountScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background, paddingTop: insets.top }}>
      <TitleHeader title="Delete Account" onBackPress={() => router.back()} />
      <DeleteAccount />
    </View>
  );
}
