// app/index.tsx
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  // Layout handles all routing logic — this screen is just a spinner
  // shown while hydration completes
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
