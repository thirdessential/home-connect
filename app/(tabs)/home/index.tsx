import HomeHeader from "@/components/common/HomeHeader";
import { useNotificationStore } from "@/store/useNotificationStore";
import { router } from "expo-router";
import { useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./HomeScreen";

export default function HomeIndexScreen() {
  const hasUnread = useNotificationStore((s) => s.items.some((i) => !i.read));
  const handleBellPress = useCallback(() => router.push("/(shared)/notifications" as any), []);
  return (
    <SafeAreaProvider>
      <HomeHeader hasUnread={hasUnread} onBellPress={handleBellPress} />
      <HomeScreen />
    </SafeAreaProvider>
  );
}
