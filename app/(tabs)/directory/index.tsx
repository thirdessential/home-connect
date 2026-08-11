import { SafeAreaProvider } from "react-native-safe-area-context";
import DirectoryHome from "./directory-home";

export default function DirectoryTab() {
  return (
    <SafeAreaProvider>
      <DirectoryHome />
    </SafeAreaProvider>
  );
}
