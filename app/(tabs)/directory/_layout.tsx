import { Stack } from "expo-router";

export default function DirectoryStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center",
        headerTransparent: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: "Community Directory" }}
      />
      <Stack.Screen
        name="directory-home"
        options={{ headerShown: false, title: "Community Directory" }}
      />
      {/* Business detail screen */}
      <Stack.Screen
        name="business/[id]"
        options={{ headerShown: false, title: "Business Profile" }}
      />
      {/* Service detail screen */}
      <Stack.Screen
        name="service/[id]"
        options={{ headerShown: false, title: "Service Profile" }}
      />
    </Stack>
  );
}
