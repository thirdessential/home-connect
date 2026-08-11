import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Login / landing screen (Terrace branding + phone number) */}
      <Stack.Screen name="login" />
      {/* OTP verification screen */}
      <Stack.Screen name="verify-otp" />
    </Stack>
  );
}
