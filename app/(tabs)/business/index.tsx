import { SafeAreaProvider } from "react-native-safe-area-context";
import DealsComingSoon from "./dealsComingSoon";

export default function BusinessIndexScreen() {
  return (
    <SafeAreaProvider>
      <DealsComingSoon />
    </SafeAreaProvider>
  );
}
