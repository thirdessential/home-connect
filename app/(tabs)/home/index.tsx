import HomeHeader from "@/components/common/HomeHeader";
import { useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./HomeScreen";

export default function HomeIndexScreen() {
  const handleBellPress = useCallback(() => {}, []);
  return (
    <SafeAreaProvider>
      <HomeHeader hasUnread={true} onBellPress={handleBellPress} />
      <HomeScreen />
    </SafeAreaProvider>
  );
}
