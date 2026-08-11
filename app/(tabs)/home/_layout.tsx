import { Stack } from "expo-router";

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
