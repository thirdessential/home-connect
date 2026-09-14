import { useNotificationStore } from "@/store/useNotificationStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const t = useTheme();
  const items = useNotificationStore((s) => s.items);
  const loading = useNotificationStore((s) => s.loading);
  const error = useNotificationStore((s) => s.error);
  const fetchAll = useNotificationStore((s) => s.fetchAll);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  // Backend is the source of truth — re-fetch every time this screen gains focus.
  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  const goBack = () => router.back();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }} edges={["top", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: t.colors.border,
        }}
      >
        <Pressable onPress={goBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={t.colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", fontFamily: "Manrope_700Bold", color: t.colors.textPrimary }}>Notifications</Text>
        <Pressable onPress={markAllRead} hitSlop={12} disabled={!items.length}>
          <Text style={{ fontSize: 14, fontWeight: "600", fontFamily: "Manrope_600SemiBold", color: items.length ? t.colors.brand : t.colors.textSecondary }}>
            Mark all
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        onRefresh={fetchAll}
        refreshing={loading}
        ListEmptyComponent={
          loading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
              <ActivityIndicator color={t.colors.brand} />
            </View>
          ) : error ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
              <Ionicons name="alert-circle-outline" size={32} color={t.colors.textSecondary} />
              <Text style={{ marginTop: 10, color: t.colors.textSecondary }}>{error}</Text>
              <Pressable onPress={fetchAll} hitSlop={12} style={{ marginTop: 12 }}>
                <Text style={{ color: t.colors.brand, fontWeight: "600", fontFamily: "Manrope_600SemiBold" }}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
              <Ionicons name="notifications-outline" size={32} color={t.colors.textSecondary} />
              <Text style={{ marginTop: 10, color: t.colors.textSecondary }}>No notifications yet</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              markRead(item.id);
              const path = item.data?.path;
              if (typeof path === "string") router.push(path as any);
            }}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 12,
              marginBottom: 8,
              borderRadius: 12,
              backgroundColor: item.read ? t.colors.surface : t.colors.brandWeak,
              borderWidth: 1,
              borderColor: t.colors.border,
              flexDirection: "row",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            {!item.read && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.brand, marginTop: 6 }} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: item.read ? "500" : "700", color: t.colors.textPrimary }}>{item.title}</Text>
              {!!item.body && (
                <Text style={{ color: t.colors.textSecondary, marginTop: 2 }}>{item.body}</Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
