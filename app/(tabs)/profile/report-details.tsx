// Admin Report Details — receives the full report (with reportedEntity)
// already fetched by society-reports.tsx, avoiding a duplicate get-by-id API.
import Badge from "@/components/UI/Badge";
import TitleHeader from "@/components/UI/TitleHeader";
import ActionButton from "@/components/inputs/ActionButton";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import TextArea from "@/components/inputs/TextArea";
import { useToast } from "@/components/common/Toast";
import { Delete, Patch, Post } from "@/lib/httpMethods";
import { useTheme } from "@/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUSES = ["PENDING", "REVIEWING", "RESOLVED", "REJECTED"] as const;

export default function ReportDetailsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { report: raw } = useLocalSearchParams<{ report: string }>();
  const [report, setReport] = useState(() => JSON.parse(raw));
  const entity = report.reportedEntity;
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const canDeleteContent = useMemo(
    () => ["POST", "POLL", "EVENT", "COMMENT"].includes(report.targetType) && !!entity,
    [report.targetType, entity],
  );

  const updateStatus = async (status: string) => {
    setBusy(true);
    try {
      await Patch(`/api/admin/reports/${report.id}`, { status });
      setReport((r: any) => ({ ...r, status, updatedAt: new Date().toISOString() }));
      showToast(`Report marked ${status.toLowerCase()}`, "success");
    } catch (err: any) {
      showToast(err?.message ?? "Failed to update status", "error");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await Delete(`/api/admin/reports/${report.id}/content`);
      setReport((r: any) => ({ ...r, status: "RESOLVED" }));
      showToast("Reported content removed. Thank you for helping keep the community safe.", "success");
    } catch (err: any) {
      showToast(err?.message ?? "Failed to delete content", "error");
    } finally {
      setBusy(false);
      setDeleteVisible(false);
    }
  };

  const sendContactMessage = async () => {
    if (!message.trim()) return;
    setBusy(true);
    try {
      await Post(`/api/admin/reports/${report.id}/contact-reporter`, { message: message.trim() });
      showToast("Message sent to reporter", "success");
      setMessage("");
    } catch (err: any) {
      showToast(err?.message ?? "Failed to send message", "error");
    } finally {
      setBusy(false);
      setContactVisible(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.colors.white, paddingTop: insets.top }]}>
      <TitleHeader title="Report Details" onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.card, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
          <View style={styles.rowLine}>
            <Text style={[styles.heading, { color: t.colors.textPrimary }]}>Report #{report.id}</Text>
            <Badge label={report.status} />
          </View>
          <Text style={[styles.label, { color: t.colors.textSecondary }]}>Type: {report.targetType}</Text>
          <Text style={[styles.label, { color: t.colors.textSecondary }]}>Reason: {report.reason}</Text>
          {!!report.description && <Text style={[styles.label, { color: t.colors.textSecondary }]}>{report.description}</Text>}
          <Text style={[styles.label, { color: t.colors.textSecondary }]}>Created: {new Date(report.createdAt).toLocaleString()}</Text>
          {!!report.updatedAt && (
            <Text style={[styles.label, { color: t.colors.textSecondary }]}>Updated: {new Date(report.updatedAt).toLocaleString()}</Text>
          )}
        </View>

        <View style={[styles.card, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
          <Text style={[styles.heading, { color: t.colors.textPrimary }]}>Reporter</Text>
          <Text style={[styles.label, { color: t.colors.textSecondary }]}>{report.reporter?.name ?? "Unknown"}</Text>
        </View>

        <View style={[styles.card, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
          <Text style={[styles.heading, { color: t.colors.textPrimary }]}>Reported {report.targetType}</Text>
          {entity ? (
            <>
              {!!entity.title && <Text style={[styles.label, { color: t.colors.textPrimary }]}>{entity.title}</Text>}
              {!!entity.content && <Text style={[styles.label, { color: t.colors.textSecondary }]}>{entity.content}</Text>}
              {!!entity.options?.length && (
                <Text style={[styles.label, { color: t.colors.textSecondary }]}>Options: {entity.options.join(", ")}</Text>
              )}
              {!!entity.location && <Text style={[styles.label, { color: t.colors.textSecondary }]}>Location: {entity.location}</Text>}
              {!!entity.date && <Text style={[styles.label, { color: t.colors.textSecondary }]}>Date: {entity.date}</Text>}
              {!!entity.author?.name && (
                <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                  {report.targetType === "COMMENT" ? "Comment by: " : "By: "}
                  {entity.author.name}
                </Text>
              )}
              {report.targetType === "COMMENT" && (entity.feedId != null || entity.eventId != null) && (
                <Text style={[styles.label, { color: t.colors.textSecondary }]}>
                  Related {entity.feedId != null ? `Feed #${entity.feedId}` : `Event #${entity.eventId}`}
                </Text>
              )}
            </>
          ) : (
            <Text style={[styles.label, { color: t.colors.textSecondary }]}>This content is no longer available (deleted).</Text>
          )}
        </View>

        <View style={styles.actions}>
          {canDeleteContent && (
            <ActionButton title="Delete Reported Content" onPress={() => setDeleteVisible(true)} disabled={busy} variant="danger" />
          )}
          <ActionButton
            title={contactVisible ? "Hide Message Box" : "Contact Reporter"}
            onPress={() => setContactVisible((v) => !v)}
            disabled={busy}
            variant="secondary"
          />
          {contactVisible && (
            <View style={[styles.card, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
              <TextArea value={message} onChangeText={setMessage} placeholder="Type your message…" />
              <ActionButton title="Send" onPress={sendContactMessage} disabled={busy || !message.trim()} />
            </View>
          )}
          {STATUSES.filter((s) => s !== report.status).map((s) => (
            <ActionButton key={s} title={`Mark as ${s.charAt(0) + s.slice(1).toLowerCase()}`} onPress={() => updateStatus(s)} disabled={busy} variant="secondary" />
          ))}
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        onConfirm={confirmDelete}
        title="Delete reported content?"
        message="This action cannot be undone."
        confirmText="Delete"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  rowLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { fontSize: 15, fontWeight: "700", fontFamily: "Manrope_700Bold", marginBottom: 4 },
  label: { fontSize: 13 },
  actions: { gap: 10, marginTop: 8 },
});
