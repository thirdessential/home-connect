// A user's own submitted reports — GET /api/reports/my (JWT-scoped, no
// admin-only fields). Mirrors society-reports.tsx's list pattern.
import Badge from "@/components/UI/Badge";
import NoDataCard from "@/components/common/NoDataCard";
import Skeleton from "@/components/UI/Skeleton";
import TitleHeader from "@/components/UI/TitleHeader";
import FormSheetModal from "@/components/modals/FormSheetModal";
import { Get } from "@/lib/httpMethods";
import { useTheme } from "@/theme/theme";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReportedEntity = {
  title?: string | null;
  content?: string | null;
  author?: { name: string } | null;
} | null;

type MyReport = {
  id: number | string;
  targetType: string;
  targetId: number | string;
  reportedEntity?: ReportedEntity;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
};

export default function MyReportsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MyReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await Get<{ success: boolean; data: MyReport[] }>("/api/reports/my");
      setReports(res?.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load your reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={[styles.container, { backgroundColor: t.colors.white, paddingTop: insets.top }]}>
      <TitleHeader title="My Reports" onBackPress={() => router.back()} />
      {loading && reports.length === 0 ? (
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={84} borderRadius={12} style={styles.skeleton} />
          ))}
        </View>
      ) : error ? (
        <NoDataCard iconName="alert-circle-outline" message="Couldn't load reports" subText={error} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }, reports.length === 0 && styles.listEmpty]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={
            <NoDataCard iconName="flag-outline" message="No reports yet" subText="Reports you submit will appear here." />
          }
          renderItem={({ item }) => {
            const entity = item.reportedEntity;
            return (
              <Pressable
                onPress={() => setSelected(item)}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderWidth: 1,
                    borderColor: t.colors.border,
                    backgroundColor: t.colors.surface, opacity: pressed ? 0.7 : 1
                  },
                ]}
              >
                <View style={[styles.row,
                {
                  borderWidth: 1,
                  borderColor: t.colors.border,
                  backgroundColor: t.colors.surface
                }, ]}>
                <View style={styles.rowTitleLine}>
                  <Text style={[styles.rowTitle, { color: t.colors.textPrimary }]}>
                    Reported {item.targetType.charAt(0) + item.targetType.slice(1).toLowerCase()}
                  </Text>
                  <Badge label={item.status} />
                </View>
                <Text style={[styles.rowContent, { color: t.colors.textPrimary }]} numberOfLines={2}>
                  {entity ? (entity.title ?? entity.content ?? `#${item.targetId}`) : "This content is no longer available"}
                </Text>
                {!!entity?.author?.name && (
                  <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>By: {entity.author.name}</Text>
                )}
                <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>Reason: {item.reason}</Text>
                {!!item.description && (
                  <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>{item.description}</Text>
                )}
                <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>
                  Reported: {new Date(item.createdAt).toLocaleDateString()}
                  {item.updatedAt && item.updatedAt !== item.createdAt
                    ? `  •  Updated: ${new Date(item.updatedAt).toLocaleDateString()}`
                    : ""}
                </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <FormSheetModal visible={!!selected} onClose={() => setSelected(null)} title="Report Details">
        {selected && (
          <View style={{ gap: 8 }}>
            <View style={styles.rowTitleLine}>
              <Text style={[styles.rowTitle, { color: t.colors.textPrimary }]}>
                Reported {selected.targetType.charAt(0) + selected.targetType.slice(1).toLowerCase()}
              </Text>
              <Badge label={selected.status} />
            </View>
            <Text style={[styles.rowContent, { color: t.colors.textPrimary }]}>
              {selected.reportedEntity
                ? (selected.reportedEntity.title ?? selected.reportedEntity.content ?? `#${selected.targetId}`)
                : "This content is no longer available"}
            </Text>
            {!!selected.reportedEntity?.author?.name && (
              <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>By: {selected.reportedEntity.author.name}</Text>
            )}
            <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>Reason: {selected.reason}</Text>
            {!!selected.description && (
              <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>{selected.description}</Text>
            )}
            <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>
              Submitted: {new Date(selected.createdAt).toLocaleString()}
            </Text>
            {!!selected.updatedAt && (
              <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>
                Updated: {new Date(selected.updatedAt).toLocaleString()}
              </Text>
            )}
          </View>
        )}
      </FormSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skeletons: { paddingHorizontal: 16, paddingTop: 12 },
  skeleton: { marginBottom: 12 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  listEmpty: { flexGrow: 1, justifyContent: "center" },
  row: { padding: 12, marginBottom: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  rowTitleLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8},
  rowTitle: { fontSize: 13, fontWeight: "600", fontFamily: "Manrope_600SemiBold", flexShrink: 1 },
  rowContent: { fontSize: 14, fontWeight: "500", fontFamily: "Manrope_500Medium" },
  rowMeta: { fontSize: 12, marginTop: 1 },
});
