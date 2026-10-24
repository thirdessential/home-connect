import UserAvatar from "@/components/UI/UserAvatar";
import { useToast } from "@/components/common/Toast";
import {
  DELAY_OPTIONS,
  REMINDER_OPTIONS,
  REPORT_DESCRIPTION_MAX,
  REPORT_TITLE_MAX,
  isValidDelay,
  lifecycleErrorMessage,
  normalizeReminders,
  organizerActions,
  remindersEqual,
  validateEventReport,
} from "@/lib/eventLifecycle";
import { useEventStore } from "@/store/useEventStore";
import { useTheme } from "@/theme/theme";
import { EventJoinRequest, EventReport } from "@/types/event.type";
import { canDecideJoinRequest, joinRequestErrorMessage } from "@/lib/eventRegistration";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

type SheetProps = { visible: boolean; title: string; onClose: () => void; children: React.ReactNode };

function Sheet({ visible, title, onClose, children }: SheetProps) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.card, { backgroundColor: t.colors.white }]} onPress={() => {}}>
          <Text style={[s.title, { color: t.colors.textPrimary }]}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export type OrganizerAction = "requests" | "close" | "complete" | "delay" | "reminders" | "reports" | "cancel";

/** The dashboard's "More" menu. Items follow the server-reported status; the server still enforces everything. */
export function OrganizerMenu({
  visible,
  status,
  onClose,
  onSelect,
  pendingRequests = 0,
}: {
  visible: boolean;
  pendingRequests?: number;
  status?: string;
  onClose: () => void;
  onSelect: (a: OrganizerAction) => void;
}) {
  const t = useTheme();
  const a = organizerActions(status);
  const items: { key: OrganizerAction; label: string; icon: any; show: boolean; danger?: boolean }[] = [
    { key: "requests", label: pendingRequests ? `Join requests (${pendingRequests})` : "Join requests", icon: "person-add-outline", show: true },
    { key: "close", label: "Close registration", icon: "lock-closed-outline", show: a.canClose },
    { key: "delay", label: "Delay event", icon: "time-outline", show: a.canDelay },
    { key: "reminders", label: "Edit reminders", icon: "notifications-outline", show: a.canEditReminders },
    { key: "complete", label: "Mark as completed", icon: "checkmark-done-outline", show: a.canComplete },
    { key: "reports", label: "Issue reports", icon: "flag-outline", show: true },
    { key: "cancel", label: "Cancel event", icon: "close-circle-outline", show: a.canCancel, danger: true },
  ];
  return (
    <Sheet visible={visible} title="Manage event" onClose={onClose}>
      {items
        .filter((i) => i.show)
        .map((i) => (
          <Pressable key={i.key} style={s.row} onPress={() => onSelect(i.key)}>
            <Ionicons name={i.icon} size={20} color={i.danger ? "#DC2626" : t.colors.brandDark} />
            <Text style={{ marginLeft: 12, fontSize: 15, color: i.danger ? "#DC2626" : t.colors.textPrimary }}>
              {i.label}
            </Text>
          </Pressable>
        ))}
    </Sheet>
  );
}

/** Chips + Apply button, shared by delay and reminders. */
function ApplyButton({ pending, disabled, label, onPress }: { pending: boolean; disabled?: boolean; label: string; onPress: () => void }) {
  const t = useTheme();
  const off = pending || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={[s.primary, { backgroundColor: t.colors.primary, opacity: off ? 0.5 : 1 }]}
    >
      {pending ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>{label}</Text>}
    </Pressable>
  );
}

function Chip({ label, on, onPress, disabled }: { label: string; on: boolean; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[s.chip, { borderColor: on ? t.colors.brandDark : t.colors.border, backgroundColor: on ? t.colors.brandWeak : "transparent" }]}
    >
      <Text style={{ color: t.colors.textPrimary, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function DelayModal({ visible, eventId, onClose, onDone }: { visible: boolean; eventId: string; onClose: () => void; onDone: () => void }) {
  const { showToast } = useToast();
  const t = useTheme();
  const delayEvent = useEventStore((st) => st.delayEvent);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (visible) { setMinutes(null); setError(null); } }, [visible]);

  const submit = async () => {
    if (pending || !isValidDelay(minutes)) return;
    setPending(true);
    setError(null);
    try {
      await delayEvent(eventId, minutes);
      showToast(`Event delayed by ${minutes} minutes`, "success");
      onClose();
      onDone();
    } catch (e: any) {
      setError(lifecycleErrorMessage(e, "delay"));
      if (e?.status === 409) onDone();
    } finally {
      setPending(false);
    }
  };
  return (
    <Sheet visible={visible} title="Delay event" onClose={() => !pending && onClose()}>
      <Text style={[s.help, { color: t.colors.secondaryText }]}>
        Moves the start time (and end time, if set) later and reschedules reminders. Participants are notified.
        The registration cutoff is not changed.
      </Text>
      <View style={s.chips}>
        {DELAY_OPTIONS.map((m) => (
          <Chip key={m} label={`${m} min`} on={minutes === m} disabled={pending} onPress={() => setMinutes(m)} />
        ))}
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
      <ApplyButton pending={pending} disabled={!isValidDelay(minutes)} label="Delay event" onPress={submit} />
    </Sheet>
  );
}

export function RemindersModal({
  visible,
  eventId,
  current,
  onClose,
  onDone,
}: {
  visible: boolean;
  eventId: string;
  current: number[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const t = useTheme();
  const setEventReminders = useEventStore((st) => st.setEventReminders);
  const [picked, setPicked] = useState<number[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (visible) { setPicked(normalizeReminders(current)); setError(null); } }, [visible]);

  const toggle = (m: number) => setPicked((p) => (p.includes(m) ? p.filter((x) => x !== m) : normalizeReminders([...p, m])));
  const submit = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await setEventReminders(eventId, picked);
      showToast("Reminders updated", "success");
      onClose();
      onDone();
    } catch (e: any) {
      setError(lifecycleErrorMessage(e, "reminders"));
      if (e?.status === 409) onDone();
    } finally {
      setPending(false);
    }
  };
  return (
    <Sheet visible={visible} title="Edit reminders" onClose={() => !pending && onClose()}>
      <Text style={[s.help, { color: t.colors.secondaryText }]}>
        A 60-minute reminder is always sent. Choose any extra reminders (minutes before start).
      </Text>
      <View style={s.chips}>
        {REMINDER_OPTIONS.map((m) => (
          <Chip key={m} label={`${m} min`} on={picked.includes(m)} disabled={pending} onPress={() => toggle(m)} />
        ))}
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
      <ApplyButton pending={pending} disabled={remindersEqual(picked, current)} label="Save reminders" onPress={submit} />
    </Sheet>
  );
}

const NEXT_STATUS: Record<EventReport["status"], EventReport["status"][]> = {
  open: ["in_review", "resolved", "dismissed"],
  in_review: ["resolved", "dismissed"],
  resolved: [],
  dismissed: [],
};
const STATUS_LABEL: Record<EventReport["status"], string> = {
  open: "Open",
  in_review: "In review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

/** Organizer view of the event-specific issue reports (GET/PATCH /api/events/:id/reports). */
export function EventReportsModal({ visible, eventId, onClose }: { visible: boolean; eventId: string; onClose: () => void }) {
  const t = useTheme();
  const { showToast } = useToast();
  const { getEventReports, updateEventReportStatus } = useEventStore();
  const [reports, setReports] = useState<EventReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    setReports(null);
    setError(null);
    getEventReports(eventId).then(setReports).catch((e) => setError(lifecycleErrorMessage(e, "report")));
  }, [visible, eventId]);

  const move = async (r: EventReport, status: EventReport["status"]) => {
    if (busyId != null) return;
    setBusyId(r.id);
    try {
      const updated = await updateEventReportStatus(eventId, r.id, status);
      setReports((list) => (list ?? []).map((x) => (x.id === r.id ? { ...x, ...updated } : x)));
    } catch (e: any) {
      showToast(lifecycleErrorMessage(e, "report"), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Sheet visible={visible} title="Issue reports" onClose={onClose}>
      {error ? (
        <Text style={s.error}>{error}</Text>
      ) : reports === null ? (
        <ActivityIndicator />
      ) : reports.length === 0 ? (
        <Text style={[s.help, { color: t.colors.secondaryText }]}>No issues reported for this event.</Text>
      ) : (
        reports.map((r) => (
          <View key={r.id} style={[s.report, { borderColor: t.colors.border }]}>
            <Text style={{ fontFamily: "Manrope_700Bold", color: t.colors.textPrimary }}>{r.title}</Text>
            <Text style={[s.help, { color: t.colors.secondaryText }]}>{r.description}</Text>
            <Text style={{ fontSize: 12, color: t.colors.secondaryText }}>
              {r.reporter?.name ?? "Resident"} · {STATUS_LABEL[r.status] ?? r.status}
            </Text>
            <View style={s.chips}>
              {NEXT_STATUS[r.status]?.map((n) => (
                <Chip key={n} label={`Mark ${STATUS_LABEL[n].toLowerCase()}`} on={false} disabled={busyId != null} onPress={() => move(r, n)} />
              ))}
            </View>
          </View>
        ))
      )}
    </Sheet>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 16 },
  card: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 22, maxHeight: "85%" },
  title: { fontSize: 18, fontFamily: "Manrope_700Bold", marginBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 13 },
  help: { fontSize: 13, lineHeight: 19, marginVertical: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 10 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6, fontSize: 15 },
  error: { color: "#DC2626", fontSize: 13, marginBottom: 8 },
  primary: { paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 4 },
  primaryText: { color: "#fff", fontSize: 16, fontFamily: "Manrope_600SemiBold" },
  report: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  decisionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  decisionBtn: { flex: 1, minHeight: 42, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  decisionText: { color: "#fff", fontSize: 14, fontFamily: "Manrope_700Bold" },
});

/** TextInput whose border turns the theme's brand green while focused (error state keeps priority). */
function FocusInput({ error, style, ...props }: TextInputProps & { error?: boolean }) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const border = error ? "#DC2626" : focused ? t.colors.brand : t.colors.border;
  return (
    <TextInput
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      placeholderTextColor={t.colors.secondaryText}
      style={[s.input, { borderColor: border, borderWidth: focused ? 2 : 1, color: t.colors.textPrimary }, style]}
    />
  );
}

/**
 * Joined participant's post-start issue report (POST /api/events/:id/reports).
 * Own modal shell: the backdrop is NOT tappable (only the X / Android back close it),
 * and the card lives in a KeyboardAvoidingView with a fixed header + scrolling body so
 * the title and description stay visible while the keyboard is open.
 */
export function ReportIssueModal({ visible, eventId, onClose }: { visible: boolean; eventId: string; onClose: () => void }) {
  const t = useTheme();
  const { showToast } = useToast();
  const submitEventReport = useEventStore((st) => st.submitEventReport);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ title?: string; description?: string; form?: string }>({});
  const [pending, setPending] = useState(false);
  useEffect(() => { if (visible) { setTitle(""); setDescription(""); setErrors({}); } }, [visible]);

  const close = () => { if (!pending) onClose(); };
  const submit = async () => {
    if (pending) return;
    if (!eventId || eventId === "undefined") return setErrors({ form: "This event couldn't be identified. Reopen it and try again." });
    const v = validateEventReport(title, description);
    if (!v.valid) return setErrors(v.errors);
    setPending(true);
    setErrors({});
    try {
      await submitEventReport(eventId, v.title, v.description);
      showToast("Report submitted", "success");
      onClose();
    } catch (e: any) {
      setErrors({ form: lifecycleErrorMessage(e, "report") });
    } finally {
      setPending(false);
    }
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[s.card, { backgroundColor: t.colors.white }]}>
          <View style={s.headerRow}>
            <Text style={[s.title, { color: t.colors.textPrimary, flex: 1, marginBottom: 0 }]}>Report an issue</Text>
            <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close" disabled={pending}>
              <Ionicons name="close" size={24} color={t.colors.textPrimary} />
            </Pressable>
          </View>
          <Text style={[s.help, { color: t.colors.secondaryText }]}>
            Tell the organizer what went wrong. You can report once the event has started.
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <FocusInput placeholder="Title" value={title} maxLength={REPORT_TITLE_MAX} editable={!pending} error={!!errors.title} onChangeText={setTitle} />
            {!!errors.title && <Text style={s.error}>{errors.title}</Text>}
            <FocusInput
              style={{ height: 100, textAlignVertical: "top" }}
              multiline
              placeholder="What went wrong?"
              value={description}
              maxLength={REPORT_DESCRIPTION_MAX}
              editable={!pending}
              error={!!errors.description}
              onChangeText={setDescription}
            />
            {!!errors.description && <Text style={s.error}>{errors.description}</Text>}
            {!!errors.form && <Text style={s.error}>{errors.form}</Text>}
            <ApplyButton pending={pending} label="Submit report" onPress={submit} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Organizer review of housefull join requests. Every decision is made by the server (capacity re-checked under lock). */
export function JoinRequestsModal({
  visible,
  eventId,
  onClose,
  onChanged,
}: {
  visible: boolean;
  eventId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const t = useTheme();
  const { showToast } = useToast();
  const { getJoinRequests, reviewJoinRequest } = useEventStore();
  const [requests, setRequests] = useState<EventJoinRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    setError(null);
    getJoinRequests(eventId)
      .then((r) => setRequests(r.requests))
      .catch((e) => setError(joinRequestErrorMessage(e)));
  };
  useEffect(() => { if (visible) { setRequests(null); load(); } }, [visible, eventId]);

  const decide = async (r: EventJoinRequest, action: "approve" | "reject") => {
    if (busyId != null) return;
    setBusyId(r.id);
    try {
      await reviewJoinRequest(eventId, r.id, action);
      showToast(action === "approve" ? "Request approved" : "Request rejected", "success");
      setRequests((list) => (list ?? []).filter((x) => x.id !== r.id));
      onChanged();
    } catch (e: any) {
      showToast(joinRequestErrorMessage(e), "error");
      // Capacity/finalized conflicts: re-sync the list and the dashboard counts.
      if (e?.status === 409 || e?.status === 404) { load(); onChanged(); }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Sheet visible={visible} title="Join requests" onClose={onClose}>
      {error ? (
        <View>
          <Text style={s.error}>{error}</Text>
          <Pressable onPress={() => { setRequests(null); load(); }} style={{ paddingVertical: 10 }}>
            <Text style={{ fontFamily: "Manrope_700Bold", color: t.colors.brand }}>Retry</Text>
          </Pressable>
        </View>
      ) : requests === null ? (
        <ActivityIndicator />
      ) : requests.length === 0 ? (
        <Text style={[s.help, { color: t.colors.secondaryText }]}>No pending join requests.</Text>
      ) : (
        <ScrollView>
          {requests.map((r) => (
            <View key={r.id} style={[s.report, { borderColor: t.colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <UserAvatar uri={r.user?.profileImage} name={r.user?.name} userId={r.user?.userId} size={36} />
                <Text style={{ fontFamily: "Manrope_700Bold", color: t.colors.textPrimary }}>{r.user?.name || "Resident"}</Text>
              </View>
              <Text style={{ fontSize: 12, color: t.colors.secondaryText }}>
                {[r.user?.tower, r.user?.unit].filter(Boolean).join(" • ")}{" "}
                · requested {new Date(r.createdAt).toLocaleString()}
              </Text>
              <Text style={{ fontSize: 12, color: t.colors.secondaryText, marginTop: 2 }}>Status: Pending</Text>
              {canDecideJoinRequest(r.status) && (
                <View style={s.decisionRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Approve ${r.user?.name ?? "request"}`}
                    disabled={busyId != null}
                    onPress={() => decide(r, "approve")}
                    style={[s.decisionBtn, { backgroundColor: t.colors.brandDark, opacity: busyId != null ? 0.6 : 1 }]}
                  >
                    {busyId === r.id ? <ActivityIndicator color="#fff" /> : <Text style={s.decisionText}>Approve</Text>}
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Reject ${r.user?.name ?? "request"}`}
                    disabled={busyId != null}
                    onPress={() => decide(r, "reject")}
                    style={[s.decisionBtn, { borderWidth: 1, borderColor: "#DC2626", opacity: busyId != null ? 0.6 : 1 }]}
                  >
                    <Text style={[s.decisionText, { color: "#DC2626" }]}>Reject</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </Sheet>
  );
}
