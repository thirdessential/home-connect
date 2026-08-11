import { SafeAreaProvider } from "react-native-safe-area-context";
import DealsHomePage from "./dealsScreen";

export default function BusinessIndexScreen() {
  return (
    <SafeAreaProvider>
      <DealsHomePage />
    </SafeAreaProvider>
  );
}
