import { Stack } from "expo-router";

export default function ProfileStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center",
        headerTransparent: false,
      }}
    >
      {/* Main Profile screen */}
      <Stack.Screen
        name="index"
        options={{
          title: "My Profile",
        }}
      />
      {/* Explicit screen config for ProfileScreen route */}
      <Stack.Screen
        name="profile-screen"
        options={{
          title: "My Profile",
        }}
      />
      <Stack.Screen
        name="my-orders"
        options={{
          title: "My Orders",
        }}
      />
      <Stack.Screen
        name="my-requests"
        options={{
          title: "My Requests",
        }}
      />
      <Stack.Screen
        name="user-business-screen"
        options={{
          title: "Business Details",
        }}
      />
      <Stack.Screen
        name="user-profile-screen"
        options={{
          title: "User Profile",
        }}
      />
      {/* Admin Dashboard */}
      <Stack.Screen
        name="admin-dashboard"
        options={{
          title: "Admin Dashboard",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
