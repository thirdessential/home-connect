import { SafeAreaProvider } from "react-native-safe-area-context";
import ProfileScreen from "./profile-screen";

export default function ProfileIndex() {
  return (
    <SafeAreaProvider>
      <ProfileScreen />
    </SafeAreaProvider>
  );
}