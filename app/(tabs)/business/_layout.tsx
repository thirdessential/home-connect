import { Stack } from "expo-router";

export default function BusinessStack() {
  return (
    <Stack>
      <Stack.Screen
        name="dealsScreen"
        options={{ headerShown: false, title: "Deals Home" }}
      />
    </Stack>
  );
}