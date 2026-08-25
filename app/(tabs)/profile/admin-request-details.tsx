import { Get } from "@/lib/httpMethods";
import { useTheme } from "@/theme/theme";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";

// Minimal details screen for GET /api/admin/requests/:type/:id.
// Renders whatever fields the API actually returns — no fabricated data.
export default function AdminRequestDetails() {
  const t = useTheme();
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !id) return;
    Get<{ success: boolean; data?: any; request?: any }>(
      `/api/admin/requests/${type}/${id}`,
    )
      .then((res: any) => setData(res?.data ?? res?.request ?? res))
      .catch((e) => setError(e?.message ?? "Failed to load details"))
      .finally(() => setLoading(false));
  }, [type, id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.background }]}>
        <ActivityIndicator color={t.colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.background }]}>
        <Text style={{ color: t.colors.textSecondary }}>{error ?? "No data found"}</Text>
      </View>
    );
  }

  const isImageField = (k: string) =>
    /photo|image|logo|proof|selfie/i.test(k) && typeof data[k] === "string";

  return (
    <ScrollView
      style={{ backgroundColor: t.colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[t.typography.h2, { color: t.colors.textPrimary, marginBottom: 12 }]}>
        {data.name || data.business_name || "Request Details"}
      </Text>

      {Object.entries(data).map(([key, value]) => {
        if (value == null || value === "" || Array.isArray(value)) return null;
        if (isImageField(key)) {
          return (
            <View key={key} style={styles.row}>
              <Text style={[t.typography.small, { color: t.colors.textSecondary }]}>{key}</Text>
              <Image source={{ uri: String(value) }} style={styles.docImage} resizeMode="cover" />
            </View>
          );
        }
        if (typeof value === "object") return null;
        return (
          <View key={key} style={styles.row}>
            <Text style={[t.typography.small, { color: t.colors.textSecondary }]}>{key}</Text>
            <Text style={[t.typography.body, { color: t.colors.textPrimary }]}>{String(value)}</Text>
          </View>
        );
      })}

      {Array.isArray(data.photos) && data.photos.length > 0 ? (
        <View style={styles.row}>
          <Text style={[t.typography.small, { color: t.colors.textSecondary }]}>photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {data.photos.map((p: any, i: number) => (
              <Image
                key={p.id ?? i}
                source={{ uri: p.url || p.photo_url }}
                style={[styles.docImage, { marginRight: 8 }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 20 },
  row: { marginBottom: 16 },
  docImage: { width: 160, height: 120, borderRadius: 10, marginTop: 6, backgroundColor: "#eee" },
});
