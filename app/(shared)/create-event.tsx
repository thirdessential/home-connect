import Chip from "@/components/UI/Chip";
import Heading from "@/components/UI/Heading";
import Label from "@/components/UI/Label";
import Select from "@/components/UI/Select";
import SuccessModal from "@/components/UI/SuccessModal";
import { useToast } from "@/components/common/Toast";
import { DatePickerField } from "@/components/form/DatePickerField";
import ImagePickerField from "@/components/form/ImagePickerField";
import { TimePickerField } from "@/components/form/TimePickerField";
import ActionButton from "@/components/inputs/ActionButton";
import GlobalInput from "@/components/UI/GlobalInput";
import { useEventStore } from "@/store/useEventStore";
import { useTheme } from "@/theme/theme";
import { formatTime12h } from "@/lib/dateTime";
import { CreateEventPayload, ParticipationType } from "@/types/event.type";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEP_LABELS = ["Event Details", "Schedule", "Participation", "Review & Publish"];

const EVENT_TYPES = [
  { id: "Sports", name: "Sports", icon: "football-outline" as const },
  { id: "Social", name: "Social", icon: "people-outline" as const },
  { id: "Cultural", name: "Cultural", icon: "musical-notes-outline" as const },
  { id: "Fitness", name: "Fitness", icon: "barbell-outline" as const },
  { id: "Kids", name: "Kids", icon: "happy-outline" as const },
  { id: "Other", name: "Other", icon: "ellipsis-horizontal" as const },
];


const DAY_OPTIONS = [1, 2, 3, 7, 14].map((n) => ({ id: String(n), name: n === 1 ? "1 day" : `${n} days` }));
const HOUR_OPTIONS = [1, 2, 3, 6, 12].map((n) => ({ id: String(n), name: n === 1 ? "1 hour" : `${n} hours` }));

const pad2 = (n: number) => String(n).padStart(2, "0");

// End = start (device-local, same as the other date maths on this screen) + duration.
function computeEnd(startDate: string, startTime: string, unit: "days" | "hours", value: number) {
  if (!startDate) return null;
  const [y, mo, d] = startDate.slice(0, 10).split("-").map(Number);
  const [h, mi] = (startTime || "00:00").split(":").map(Number);
  const end = new Date(y, mo - 1, d, h, mi);
  if (unit === "days") end.setDate(end.getDate() + value);
  else end.setTime(end.getTime() + value * 3600 * 1000);
  return {
    date: `${end.getFullYear()}-${pad2(end.getMonth() + 1)}-${pad2(end.getDate())}`,
    time: `${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
  };
}

const fmtDateTime = (date: string, time: string) => {
  if (!date) return "";
  const [y, mo, d] = date.slice(0, 10).split("-").map(Number);
  const day = new Date(y, mo - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return time ? `${day} · ${formatTime12h(time)}` : day;
};

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.reviewSection, { borderColor: t.colors.border, backgroundColor: t.colors.cardBackground }]}>
      <Text style={[t.typography.small, { color: t.colors.brandDark, fontFamily: "Manrope_700Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }]}>{title}</Text>
      {children}
    </View>
  );
}

// Skips rows with no value so optional/empty fields never render as blank/undefined.
function ReviewRow({ label, value }: { label?: string; value?: string | null }) {
  const t = useTheme();
  if (!value) return null;
  return (
    <View style={{ marginBottom: 8 }}>
      {label ? <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>{label}</Text> : null}
      <Text style={[t.typography.body, { color: t.colors.text }]}>{value}</Text>
    </View>
  );
}

const CLOSES_OPTIONS = [
  { id: "0", name: "Registration closes at event start" },
  { id: "3", name: "3 hours before event" },
  { id: "6", name: "6 hours before event" },
  { id: "12", name: "12 hours before event" },
  { id: "24", name: "1 day before event" },
];

export default function CreateEventScreen() {
  const t = useTheme();
  const { showToast } = useToast();
  const { createEvent, saving } = useEventStore();

  const [step, setStep] = useState(1);
  const [published, setPublished] = useState<{ id: number } | null>(null);

  // Step 1
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string[]>([]);

  // Step 2
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationType, setDurationType] = useState<"days" | "hours">("days");
  const [daysDuration, setDaysDuration] = useState(1);
  const [hoursDuration, setHoursDuration] = useState(1);
  const [venue, setVenue] = useState("");
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  // Step 3
  const [participationType, setParticipationType] = useState<ParticipationType>("free");
  const [feeAmount, setFeeAmount] = useState("");
  const [minParticipants, setMinParticipants] = useState(1);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(20);
  const [closesHours, setClosesHours] = useState("3");
  const [rules, setRules] = useState("");
  const [agree, setAgree] = useState(false);

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  const handleClose = () => router.back();

  const next1 = () => {
    if (title.trim().length > 70) return showToast("Title must be 70 characters or fewer", "error");
    if (description.trim().length > 300) return showToast("Description must be 300 characters or fewer", "error");
    if (image.length > 5) return showToast("You can add at most 5 images", "error");
    if (title.trim().length < 3) return showToast("Enter an event title", "error");
    if (!eventType) return showToast("Select an event type", "error");
    if (description.trim().length < 5) return showToast("Add a short description", "error");
    setStep(2);
  };

  const next2 = () => {
    if (!startDate) return showToast("Start date is required", "error");
    const [y, mo, d] = startDate.slice(0, 10).split("-").map(Number);
    const [hh, mi] = (startTime || "00:00").split(":").map(Number);
    if (new Date(y, mo - 1, d, hh, mi).getTime() < Date.now() + 2 * 3600 * 1000) {
      return showToast("Event must start at least 2 hours from now", "error");
    }
    if (!venue.trim()) return showToast("Venue is required", "error");
    setStep(3);
  };

  const next3 = () => {
    if (participationType === "paid" && (!feeAmount || Number(feeAmount) <= 0)) {
      return showToast("Enter a valid participation fee", "error");
    }
    {
      const [y, mo, d] = startDate.slice(0, 10).split("-").map(Number);
      const [h, mi] = (startTime || "00:00").split(":").map(Number);
      if (new Date(y, mo - 1, d, h, mi).getTime() - Number(closesHours) * 3600 * 1000 <= Date.now())
        return showToast("Registration would already be closed — pick a shorter option or a later start", "error");
    }
    if (minParticipants < 1) {
      return showToast("Minimum participants must be at least 1", "error");
    }
    if (maxParticipants !== null && maxParticipants < minParticipants) {
      return showToast("Maximum cannot be less than minimum participants", "error");
    }
    setStep(4);
  };

  // Calculated cutoff for the Review screen (device-local, display only).
  const closesAtLabel = (() => {
    if (!startDate) return "";
    const [y, mo, d] = startDate.slice(0, 10).split("-").map(Number);
    const [h, mi] = (startTime || "00:00").split(":").map(Number);
    const c = new Date(new Date(y, mo - 1, d, h, mi).getTime() - Number(closesHours) * 3600 * 1000);
    return `${c.toLocaleDateString("en-US", { day: "numeric", month: "short" })}, ${c.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  })();

  const durationLabel =
    durationType === "days"
      ? DAY_OPTIONS.find((o) => o.id === String(daysDuration))?.name ?? `${daysDuration} days`
      : HOUR_OPTIONS.find((o) => o.id === String(hoursDuration))?.name ?? `${hoursDuration} hours`;

  const calculatedEnd = computeEnd(startDate, startTime, durationType, durationType === "days" ? daysDuration : hoursDuration);
  const endDate = calculatedEnd?.date ?? "";
  const endTime = calculatedEnd?.time ?? "";

  const handlePublish = async () => {
    if (!agree) return showToast("Please confirm the details are correct", "error");
    const payload: CreateEventPayload = {
      eventtitle: title.trim(),
      eventtype: eventType!,
      description: description.trim(),
      startdate: startDate,
      ...(startTime ? { starttime: startTime } : {}),
      ...(endDate ? { enddate: endDate } : {}),
      ...(endTime ? { endtime: endTime } : {}),
      venue: venue.trim(),
      participationtype: participationType,
      ...(participationType === "paid" ? { participationfeeamount: Number(feeAmount) } : {}),
      minimumparticipants: minParticipants,
      ...(maxParticipants !== null ? { maximumparticipants: maxParticipants } : {}),
      registrationclosesbefore: Number(closesHours),
      ...(rules.trim() ? { rulesthingstobring: rules.trim() } : {}),
    };
    try {
      const imgs = image
        .filter((u) => !u.startsWith("http"))
        .map((uri, i) => ({ uri, name: `event-${i}.jpg`, type: "image/jpeg" }));
      const created = await createEvent(payload, imgs);
      setPublished({ id: created.id });
    } catch (e: any) {
      showToast(e?.message ?? "Failed to publish event", "error");
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.white }]} edges={["top", "bottom"]}>
      <View style={styles.headerRow}>
        <Pressable onPress={goBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={t.colors.text} />
        </Pressable>
        <Heading level={3}>Create Event</Heading>
        <View style={{ width: 24 }} />
      </View>

      {/* Stepper */}
      
      <Text style={[t.typography.h4, { color: t.colors.brandDark, textAlign: "center", fontFamily: "Manrope_700Bold", marginBottom: 8, marginTop: 15 }]}>
        {STEP_LABELS[step - 1]}
      </Text>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View>
            <GlobalInput label="Event Title *" placeholder="e.g. Weekend Cricket Match" value={title} onChangeText={setTitle} maxLength={70} />
            <Text style={{ alignSelf: "flex-end", fontSize: 12, color: t.colors.secondaryText, marginTop: -8, marginBottom: 8 }}>{title.length}/70</Text>
            <Select label="Event Type *" options={EVENT_TYPES} selectedId={eventType} onChange={setEventType} placeholder="Select event type" leftIcon="pricetag-outline" />
            <GlobalInput label="Description *" placeholder="Tell your neighbours what this event is about…" value={description} onChangeText={setDescription} maxLength={300} multiline numberOfLines={4} />
            <Text style={{ alignSelf: "flex-end", fontSize: 12, color: t.colors.secondaryText, marginTop: -8, marginBottom: 8 }}>{description.length}/300</Text>
            <ImagePickerField
              label="Event Images (Optional, max 5)"
              mode="multiple"
              value={image}
              onChange={setImage}
              max={5}
              aspectRatios={["16:9", "4:5", "1:1", "9:16"]}
              defaultAspectRatio="16:9"
            />
          </View>
        )}

        {step === 2 && (
          <View>
            <Heading level={5} style={{ marginBottom: 4 }}>Start Date & Time</Heading>
            <View style={styles.row2}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <DatePickerField label="Start Date *" value={startDate} onChange={(d) => { setStartDate(d); setOpenPicker(null); }} minimumDate={new Date()} show={openPicker === "start"} setShow={(v) => setOpenPicker(v ? "start" : null)} />
              </View>
              <View style={{ flex: 1 }}>
                <TimePickerField label="Start Time" value={startTime} onChange={(v) => { setStartTime(v); setOpenPicker(null); }} show={openPicker === "startTime"} setShow={(v) => setOpenPicker(v ? "startTime" : null)} />
              </View>
            </View>

            <Heading level={5} style={{ marginTop: 8, marginBottom: 4 }}>End Date & Time (Optional)</Heading>
            <View style={[styles.durationTabs, { backgroundColor: t.colors.surfaceAlt }]}>
              {(["days", "hours"] as const).map((k) => {
                const active = durationType === k;
                return (
                  <Pressable key={k} onPress={() => setDurationType(k)} style={[styles.durationTab, active && { backgroundColor: t.colors.brand }]}>
                    <Text style={[t.typography.body, { color: active ? "#FFFFFF" : t.colors.text, fontFamily: active ? "Manrope_700Bold" : "Manrope_400Regular" }]}>
                      {k === "days" ? "Days" : "Time"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {durationType === "days" ? (
              <Select label="End after (days)" options={DAY_OPTIONS} selectedId={String(daysDuration)} onChange={(id) => setDaysDuration(Number(id))} />
            ) : (
              <Select label="End after (hours)" options={HOUR_OPTIONS} selectedId={String(hoursDuration)} onChange={(id) => setHoursDuration(Number(id))} />
            )}

            <GlobalInput label="Venue *" placeholder="e.g. Central Ground, Life Republic" value={venue} onChangeText={setVenue} leftIcon="location-outline" />
          </View>
        )}

        {step === 3 && (
          <View>
            <Label>Participation Fee *</Label>
            <View style={styles.feeRow}>
              <Pressable style={styles.feeOption} onPress={() => setParticipationType("free")}>
                <Ionicons name={participationType === "free" ? "radio-button-on" : "radio-button-off"} size={20} color={t.colors.brandDark} />
                <Text style={[t.typography.body, { marginLeft: 8, color: t.colors.text }]}>Free</Text>
              </Pressable>
              <Pressable style={styles.feeOption} onPress={() => setParticipationType("paid")}>
                <Ionicons name={participationType === "paid" ? "radio-button-on" : "radio-button-off"} size={20} color={t.colors.brandDark} />
                <Text style={[t.typography.body, { marginLeft: 8, color: t.colors.text }]}>Paid</Text>
              </Pressable>
            </View>
            {participationType === "paid" ? (
              <GlobalInput label="Amount (₹) *" placeholder="0" value={feeAmount} onChangeText={setFeeAmount} keyboardType="numeric" />
            ) : null}

            <Label>Minimum Participants *</Label>
            <View style={styles.stepperControlRow}>
              <Pressable style={styles.stepperBtn} onPress={() => setMinParticipants((v) => Math.max(1, v - 1))}><Text style={styles.stepperBtnText}>−</Text></Pressable>
              <Text style={[t.typography.h4, { color: t.colors.text, width: 48, textAlign: "center" }]}>{minParticipants}</Text>
              <Pressable style={styles.stepperBtn} onPress={() => setMinParticipants((v) => v + 1)}><Text style={styles.stepperBtnText}>+</Text></Pressable>
            </View>

            <Label>Maximum Participants (Optional)</Label>
            {maxParticipants === null ? (
              <Pressable
                style={[styles.stepperBtn, { width: "auto", paddingHorizontal: 14 }]}
                onPress={() => setMaxParticipants(minParticipants)}
              >
                <Text style={[t.typography.body, { color: t.colors.secondaryText }]}>No limit — tap to set a maximum</Text>
              </Pressable>
            ) : (
              <View style={styles.stepperControlRow}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() =>
                    setMaxParticipants((v) => (v !== null && v - 1 < minParticipants ? null : (v as number) - 1))
                  }
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </Pressable>
                <Text style={[t.typography.h4, { color: t.colors.text, width: 48, textAlign: "center" }]}>{maxParticipants}</Text>
                <Pressable style={styles.stepperBtn} onPress={() => setMaxParticipants((v) => (v as number) + 1)}><Text style={styles.stepperBtnText}>+</Text></Pressable>
              </View>
            )}

            <Select label="Registration closes*" options={CLOSES_OPTIONS} selectedId={closesHours} onChange={setClosesHours} leftIcon="time-outline" />
            <GlobalInput label="Rules / Things to Bring (Optional)" placeholder="Add any rules, guidelines or things participants should bring…" value={rules} onChangeText={setRules} maxLength={250} multiline numberOfLines={3} />
          </View>
        )}

        {step === 4 && (
          <View>
            {image[0] ? (
              <Image source={{ uri: image[0] }} style={[styles.previewImage, { borderRadius: 12, marginBottom: 12 }]} contentFit="cover" />
            ) : null}

            <ReviewSection title="Event Details">
              <ReviewRow label="Category" value={eventType} />
              <ReviewRow label="Title" value={title.trim()} />
              <ReviewRow label="Description" value={description.trim()} />
            </ReviewSection>

            <ReviewSection title="Schedule">
              <ReviewRow label="Start" value={fmtDateTime(startDate, startTime)} />
              <ReviewRow label="Duration" value={durationLabel} />
              <ReviewRow label="Ends" value={fmtDateTime(endDate, endTime)} />
              <ReviewRow
                label="Registration closes"
                value={`${CLOSES_OPTIONS.find((o) => o.id === closesHours)?.name ?? ""}${closesAtLabel ? `\n${closesAtLabel}` : ""}`}
              />
            </ReviewSection>

            <ReviewSection title="Location">
              <ReviewRow label="Venue" value={venue.trim()} />
            </ReviewSection>

            <ReviewSection title="Participants">
              <ReviewRow label="Minimum" value={String(minParticipants)} />
              <ReviewRow label="Maximum" value={maxParticipants !== null ? String(maxParticipants) : "No limit"} />
            </ReviewSection>

            <ReviewSection title="Pricing">
              <ReviewRow label="Participation fee" value={participationType === "free" ? "Free" : `₹${feeAmount}`} />
            </ReviewSection>

            {rules.trim() ? (
              <ReviewSection title="Rules / Things to Bring">
                <ReviewRow value={rules.trim()} />
              </ReviewSection>
            ) : null}

            {image.length > 0 ? (
              <ReviewSection title={`Images (${image.length})`}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {image.map((uri, idx) => (
                    <Image key={`${uri}-${idx}`} source={{ uri }} style={styles.reviewThumb} contentFit="cover" />
                  ))}
                </ScrollView>
              </ReviewSection>
            ) : null}

            <Pressable style={styles.agreeRow} onPress={() => setAgree((a) => !a)}>
              <Ionicons name={agree ? "checkbox" : "square-outline"} size={20} color={t.colors.brandDark} />
              <Text style={[t.typography.small, { color: t.colors.text, marginLeft: 8, flex: 1 }]}>
                I confirm that all the details are correct.
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderColor: t.colors.border }]}>
        <ActionButton
          title={step === 4 ? "Publish Event" : `Next: ${STEP_LABELS[step]}`}
          onPress={step === 1 ? next1 : step === 2 ? next2 : step === 3 ? next3 : handlePublish}
          variant="primary"
          size="lg"
          fullWidth
          loading={saving}
          disabled={saving}
          containerStyle={{ backgroundColor: t.colors.brandDark, borderRadius: t.radii.medium }}
        />
      </View>

      <SuccessModal
        visible={!!published}
        onClose={() => router.dismissTo("/(tabs)/home")}
        title="Your event is live!"
        subtitle={`${title} has been published successfully.`}
        primaryActionLabel="Go to Event Dashboard"
        onPrimaryAction={() => {
          if (published) router.replace({ pathname: "/(shared)/event-dashboard", params: { eventId: String(published.id) } });
        }}
        secondaryActionLabel="Back to Home"
        secondaryCountdownMs={3000}
        onSecondaryAction={() => router.dismissTo("/(tabs)/home")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  stepperRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 32, marginBottom: 4 },
  stepperItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stepLine: { flex: 1, height: 2, marginHorizontal: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  durationTabs: { flexDirection: "row", borderRadius: 10, padding: 3, marginBottom: 12 },
  durationTab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 8 },
  reviewSection: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  reviewThumb: { width: 96, height: 96, borderRadius: 10, marginRight: 8 },
  row2: { flexDirection: "row" },
  feeRow: { flexDirection: "row", gap: 24, marginBottom: 16 },
  feeOption: { flexDirection: "row", alignItems: "center" },
  stepperControlRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  stepperBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  stepperBtnText: { fontSize: 20, fontFamily: "Manrope_700Bold" },
  previewCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  previewImage: { width: "100%", height: 160 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  agreeRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1 },
});
