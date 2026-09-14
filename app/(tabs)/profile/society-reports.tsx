// Admin/Super Admin only — all reports submitted society-wide. Frontend hides
// the nav entry for other roles; backend enforces the real authorization on
// GET /api/admin/reports.
import Badge from "@/components/UI/Badge";
import NoDataCard from "@/components/common/NoDataCard";
import Skeleton from "@/components/UI/Skeleton";
import TitleHeader from "@/components/UI/TitleHeader";
import { Get } from "@/lib/httpMethods";
import { useTheme } from "@/theme/theme";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReportedEntity = {
  title?: string | null;
  content?: string | null;
  image?: string | null;
  profileImage?: string | null;
  author?: { name: string; profileImage?: string | null } | null;
} | null;

type AdminReport = {
  id: number | string;
  targetType: string;
  targetId: number | string;
  reportedEntity?: ReportedEntity;
  reason: string;
  description?: string;
  status: string;
  reporter?: { id: number | string; name: string; profileImage?: string | null };
  createdAt: string;
  updatedAt?: string;
};

export default function SocietyReportsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    setError(null);
    try {
      // Real shape: { success, data: { reports: [...], pagination: { page, totalPages } } }
      const res = await Get<{ success: boolean; data: { reports: AdminReport[]; pagination: { page: number; totalPages: number } } }>(
        `/api/admin/reports?page=${pageToLoad}&limit=20`,
      );
      const rows = res?.data?.reports ?? [];
      setReports((prev) => (pageToLoad > 1 ? [...prev, ...rows] : rows));
      setPage(res?.data?.pagination?.page ?? pageToLoad);
      setTotalPages(res?.data?.pagination?.totalPages ?? 1);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <View style={[styles.container, { backgroundColor: t.colors.white, paddingTop: insets.top }]}>
      <TitleHeader title="Society Reports" onBackPress={() => router.back()} />
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
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(1)} />}
          ListEmptyComponent={
            <NoDataCard iconName="flag-outline" message="No reports submitted" subText="Reports residents submit will appear here." />
          }
          renderItem={({ item }) => {
            const entity = item.reportedEntity;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/profile/report-details", params: { report: JSON.stringify(item) } })}
                style={[styles.row, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}
              >
                <View style={styles.rowTitleLine}>
                  <Text style={[styles.rowTitle, { color: t.colors.textPrimary }]}>
                    {item.targetType}
                    {entity ? `: ${entity.title ?? entity.content ?? `#${item.targetId}`}` : ` #${item.targetId} (deleted)`}
                  </Text>
                  <Badge label={item.status} />
                </View>
                {!!entity?.content && !!entity?.title && (
                  <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]} numberOfLines={2}>{entity.content}</Text>
                )}
                {!!entity?.author?.name && (
                  <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>By: {entity.author.name}</Text>
                )}
                {!!item.reporter?.name && (
                  <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>Reported by: {item.reporter.name}</Text>
                )}
                <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>Reason: {item.reason}</Text>
                {!!item.description && (
                  <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>{item.description}</Text>
                )}
                <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]}>
                  Created: {new Date(item.createdAt).toLocaleString()}
                  {item.updatedAt ? `  •  Updated: ${new Date(item.updatedAt).toLocaleString()}` : ""}
                </Text>
              </TouchableOpacity>
            );
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loading && page < totalPages) load(page + 1);
          }}
        />
      )}
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
  rowTitleLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rowTitle: { fontSize: 15, fontWeight: "600", fontFamily: "Manrope_600SemiBold", flexShrink: 1 },
  rowMeta: { fontSize: 12, marginTop: 1 },
});
