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
import {
  DEFAULT_END_DAYS_AFTER,
  DEFAULT_END_HOURS_AFTER,
  END_DAY_OPTIONS,
  END_HOUR_OPTIONS,
  MAX_EVENT_PARTICIPANTS,
  MIN_EVENT_PARTICIPANTS,
  STEP_FIELDS,
  buildCreateEventPayload,
  computeEnd,
  firstInvalidField,
  initialEventFormValues,
  partsToDate,
  stepMaxParticipants,
  stepMinParticipants,
  stepOfField,
  validateEventForm,
  validateEventStep,
  visibleFieldErrors,
  type EventFormField,
  type EventFormValues,
  type FieldErrors,
} from "@/lib/createEventForm";
import { CreateEventPayload, ParticipationType } from "@/types/event.type";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
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

const DAY_OPTIONS = END_DAY_OPTIONS.map((n) => ({ id: String(n), name: n === 1 ? "1 day" : `${n} days` }));
const HOUR_OPTIONS = END_HOUR_OPTIONS.map((n) => ({ id: String(n), name: n === 1 ? "1 hour" : `${n} hours` }));

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
  { id: "0", name: "At event start" },
  { id: "3", name: "3 hours before event" },
  { id: "6", name: "6 hours before event" },
  { id: "12", name: "12 hours before event" },
  { id: "24", name: "1 day before event" },
];

// Inline validation message under a field (red, announced to screen readers).
function FieldError({ message }: { message?: string }) {
  const t = useTheme();
  if (!message) return null;
  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{ color: t.colors.error, fontSize: 12, marginTop: -(t.spacing.l - 4), marginBottom: t.spacing.m }}
    >
      {message}
    </Text>
  );
}

export default function CreateEventScreen() {
  const t = useTheme();
  const { showToast } = useToast();
  const { createEvent, saving } = useEventStore();

  const [step, setStep] = useState(1);
  const [published, setPublished] = useState<{ id: number } | null>(null);

  // New-event defaults are computed once on mount and only SEED the state below; re-renders and
  // step changes never re-apply them, so user edits are never overwritten.
  const [initial] = useState(() => initialEventFormValues());

  // Step 1
  const [title, setTitle] = useState(initial.title);
  const [eventType, setEventType] = useState<string | null>(initial.eventType);
  const [description, setDescription] = useState(initial.description);
  const [image, setImage] = useState<string[]>(initial.images);

  // Step 2
  const [startDate, setStartDate] = useState(initial.startDate);
  const [startTime, setStartTime] = useState(initial.startTime);
  // End date = start date + N days, end time = start time + N hours (two independent dropdowns).
  // The end is derived from the start, so it follows start changes while the chosen offsets persist.
  const [endDaysAfter, setEndDaysAfter] = useState(DEFAULT_END_DAYS_AFTER);
  const [endHoursAfter, setEndHoursAfter] = useState(DEFAULT_END_HOURS_AFTER);
  const { endDate, endTime } = computeEnd(startDate, startTime, endDaysAfter, endHoursAfter);
  const { width: screenWidth } = useWindowDimensions();
  const stackEnd = screenWidth < 360; // very narrow phones: dropdowns stack instead of sitting side by side
  const [venue, setVenue] = useState(initial.venue);
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  // Step 3
  const [participationType, setParticipationType] = useState<ParticipationType>(initial.participationType);
  const [feeAmount, setFeeAmount] = useState(initial.feeAmount);
  const [minParticipants, setMinParticipants] = useState(initial.minParticipants);
  const [maxParticipants, setMaxParticipants] = useState(initial.maxParticipants);
  const [closesHours, setClosesHours] = useState(initial.closesHours);
  const [rules, setRules] = useState(initial.rules);
  const [agree, setAgree] = useState(initial.agree);

  const values: EventFormValues = {
    title, eventType, description, images: image,
    startDate, startTime, endDate, endTime, venue,
    participationType, feeAmount, minParticipants, maxParticipants, closesHours, rules, agree,
  };

  // Validation: a failed Next/Publish "flags" every invalid field at once. A flagged field stays red
  // only while it is still invalid, so fixing it clears the border and message immediately.
  const [flagged, setFlagged] = useState<EventFormField[]>([]);
  const stepKey = step as 1 | 2 | 3 | 4;
  const errors = visibleFieldErrors(flagged, validateEventStep(stepKey, values));

  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const anchors = useRef<Partial<Record<EventFormField, View | null>>>({});
  const anchor = (f: EventFormField) => ({
    ref: (el: View | null) => { anchors.current[f] = el; },
    collapsable: false as const,
  });
  const [scrollTarget, setScrollTarget] = useState<{ field: EventFormField; n: number } | null>(null);

  // Runs after the (possibly new) step has rendered, so the field's position can be measured.
  useEffect(() => {
    if (!scrollTarget) return;
    const id = requestAnimationFrame(() => {
      const el = anchors.current[scrollTarget.field];
      const content = contentRef.current;
      if (!el || !content) return;
      el.measureLayout(content, (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true }), () => {});
    });
    return () => cancelAnimationFrame(id);
  }, [scrollTarget]);

  const flag = (errs: FieldErrors, onStep: 1 | 2 | 3 | 4) => {
    setFlagged((prev) => Array.from(new Set([...prev, ...(Object.keys(errs) as EventFormField[])])));
    const first = firstInvalidField(onStep, errs);
    if (first) setScrollTarget({ field: first, n: Date.now() });
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  const handleClose = () => router.back();

  const goNext = () => {
    const errs = validateEventStep(stepKey, values);
    if (Object.keys(errs).length) return flag(errs, stepKey);
    setFlagged((prev) => prev.filter((f) => stepOfField(f) !== stepKey));
    setStep(step + 1);
  };

  const onStartDateChange = (d: string) => {
    setStartDate(d);
    setOpenPicker(null);
  };
  const onStartTimeChange = (v: string) => {
    setStartTime(v);
    setOpenPicker(null);
  };

  // Calculated cutoff for the Review screen (device-local, display only).
  const closesAtLabel = (() => {
    const start = partsToDate(startDate, startTime);
    if (!start) return "";
    const c = new Date(start.getTime() - Number(closesHours) * 3600 * 1000);
    return `${c.toLocaleDateString("en-US", { day: "numeric", month: "short" })}, ${c.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  })();

  const handlePublish = async () => {
    // Re-validate everything: the start may have drifted inside the 2-hour window since step 2.
    const errs = validateEventForm(values, new Date(), { requireAgree: true });
    if (Object.keys(errs).length) {
      const failingStep = ([1, 2, 3, 4] as const).find((s) => STEP_FIELDS[s].some((f) => errs[f])) ?? 4;
      if (failingStep !== 4) {
        setStep(failingStep);
        showToast("Please fix the highlighted fields", "error");
      }
      return flag(errs, failingStep);
    }
    const payload: CreateEventPayload = buildCreateEventPayload(values);
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <View ref={contentRef} collapsable={false}>
        {step === 1 && (
          <View>
            <View {...anchor("title")}>
              <GlobalInput label="Event Title *" placeholder="e.g. Weekend Cricket Match" value={title} onChangeText={setTitle} maxLength={70} error={errors.title} />
            </View>
            <Text style={{ alignSelf: "flex-end", fontSize: 12, color: t.colors.secondaryText, marginTop: -8, marginBottom: 8 }}>{title.length}/70</Text>
            <View {...anchor("eventType")}>
              <Select label="Event Type *" options={EVENT_TYPES} selectedId={eventType} onChange={setEventType} placeholder="Select event type" leftIcon="pricetag-outline" error={!!errors.eventType} />
              <FieldError message={errors.eventType} />
            </View>
            <View {...anchor("description")}>
              <GlobalInput textArea label="Description *" placeholder="Tell your neighbours what this event is about…" value={description} onChangeText={setDescription} maxLength={300} multiline numberOfLines={5} error={errors.description} />
            </View>
            <Text style={{ alignSelf: "flex-end", fontSize: 12, color: t.colors.secondaryText, marginTop: -8, marginBottom: 8 }}>{description.length}/300</Text>
            <View {...anchor("images")}>
              <ImagePickerField
                label="Event Images (Optional, max 5)"
                mode="multiple"
                value={image}
                onChange={setImage}
                max={5}
                aspectRatios={["16:9", "4:5", "1:1", "9:16"]}
                defaultAspectRatio="16:9"
              />
              <FieldError message={errors.images} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Heading level={5} style={{ marginBottom: 4 }}>Start Date & Time</Heading>
            <View style={styles.row2}>
              <View style={{ flex: 1, marginRight: 8 }} {...anchor("startDate")}>
                <DatePickerField label="Start Date *" value={startDate} onChange={onStartDateChange} minimumDate={new Date()} error={errors.startDate} show={openPicker === "start"} setShow={(v) => setOpenPicker(v ? "start" : null)} />
              </View>
              <View style={{ flex: 1 }} {...anchor("startTime")}>
                <TimePickerField label="Start Time *" value={startTime} onChange={onStartTimeChange} error={errors.startTime} show={openPicker === "startTime"} setShow={(v) => setOpenPicker(v ? "startTime" : null)} />
              </View>
            </View>

            <Heading level={5} style={{ marginTop: 8, marginBottom: 4 }}>End Date & Time</Heading>
            <View style={stackEnd ? undefined : styles.row2}>
              <View style={stackEnd ? undefined : { flex: 1, marginRight: 8 }} {...anchor("endDate")}>
                <Select label="End after (days)" options={DAY_OPTIONS} selectedId={String(endDaysAfter)} onChange={(id) => setEndDaysAfter(Number(id))} error={!!errors.endDate} />
                <FieldError message={errors.endDate} />
              </View>
              <View style={stackEnd ? undefined : { flex: 1 }} {...anchor("endTime")}>
                <Select label="End after (hours)" options={HOUR_OPTIONS} selectedId={String(endHoursAfter)} onChange={(id) => setEndHoursAfter(Number(id))} error={!!errors.endTime} />
                <FieldError message={errors.endTime} />
              </View>
            </View>
            <Text style={{ fontSize: 12, color: t.colors.secondaryText, marginTop: -8, marginBottom: 12 }}>
              Ends {fmtDateTime(endDate, endTime)}
            </Text>

            <View {...anchor("venue")}>
              <GlobalInput label="Venue *" placeholder="e.g. Central Ground, Life Republic" value={venue} onChangeText={setVenue} leftIcon="location-outline" error={errors.venue} />
            </View>
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
              <View {...anchor("feeAmount")}>
                <GlobalInput label="Amount (₹) *" placeholder="0" value={feeAmount} onChangeText={setFeeAmount} keyboardType="numeric" error={errors.feeAmount} />
              </View>
            ) : null}

            <View {...anchor("minParticipants")}>
              <Label>Minimum Participants *</Label>
              <View style={styles.stepperControlRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease minimum participants"
                  disabled={minParticipants <= MIN_EVENT_PARTICIPANTS}
                  style={[styles.stepperBtn, errors.minParticipants ? styles.stepperBtnError : null, minParticipants <= MIN_EVENT_PARTICIPANTS && styles.stepperBtnOff]}
                  onPress={() => setMinParticipants((v) => stepMinParticipants(v, maxParticipants, -1))}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </Pressable>
                <Text style={[t.typography.h4, { color: t.colors.text, width: 48, textAlign: "center" }]}>{minParticipants}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase minimum participants"
                  disabled={minParticipants >= Math.min(maxParticipants, MAX_EVENT_PARTICIPANTS)}
                  style={[styles.stepperBtn, errors.minParticipants ? styles.stepperBtnError : null, minParticipants >= Math.min(maxParticipants, MAX_EVENT_PARTICIPANTS) && styles.stepperBtnOff]}
                  onPress={() => setMinParticipants((v) => stepMinParticipants(v, maxParticipants, +1))}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </Pressable>
              </View>
              <FieldError message={errors.minParticipants} />
            </View>

            <View {...anchor("maxParticipants")}>
              <Label>Maximum Participants *</Label>
              <View style={styles.stepperControlRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease maximum participants"
                  disabled={maxParticipants <= minParticipants}
                  style={[styles.stepperBtn, errors.maxParticipants ? styles.stepperBtnError : null, maxParticipants <= minParticipants && styles.stepperBtnOff]}
                  onPress={() => setMaxParticipants((v) => stepMaxParticipants(v, minParticipants, -1))}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </Pressable>
                <TextInput
                  accessibilityLabel="Maximum participants"
                  value={Number.isFinite(maxParticipants) ? String(maxParticipants) : ""}
                  onChangeText={(txt) => {
                    const digits = txt.replace(/\D/g, "").slice(0, 3);
                    setMaxParticipants(digits === "" ? Number.NaN : Number(digits));
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                  selectTextOnFocus
                  style={[
                    t.typography.h4,
                    { color: t.colors.text, width: 64, height: 40, marginHorizontal: 4, textAlign: "center", borderWidth: 1.5, borderRadius: 10, borderColor: errors.maxParticipants ? t.colors.error : "#E5E7EB", paddingVertical: 0 },
                  ]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase maximum participants"
                  disabled={maxParticipants >= MAX_EVENT_PARTICIPANTS}
                  style={[styles.stepperBtn, errors.maxParticipants ? styles.stepperBtnError : null, maxParticipants >= MAX_EVENT_PARTICIPANTS && styles.stepperBtnOff]}
                  onPress={() => setMaxParticipants((v) => stepMaxParticipants(v, minParticipants, +1))}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </Pressable>
              </View>
              {errors.maxParticipants ? (
                <FieldError message={errors.maxParticipants} />
              ) : (
                <Text style={{ fontSize: 12, color: t.colors.secondaryText, marginTop: -8, marginBottom: 12 }}>
                  Between {MIN_EVENT_PARTICIPANTS} and {MAX_EVENT_PARTICIPANTS} participants
                </Text>
              )}
            </View>

            <View {...anchor("closesHours")}>
              <Select label="Registration closes*" options={CLOSES_OPTIONS} selectedId={closesHours} onChange={setClosesHours} leftIcon="time-outline" error={!!errors.closesHours} />
              <FieldError message={errors.closesHours} />
            </View>
            <View {...anchor("rules")}>
              <GlobalInput textArea label="Rules / Things to Bring (Optional)" placeholder="Add any rules, guidelines or things participants should bring…" value={rules} onChangeText={setRules} maxLength={250} multiline numberOfLines={3} error={errors.rules} />
            </View>
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
              <ReviewRow label="Maximum" value={String(maxParticipants)} />
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

            <View {...anchor("agree")}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agree }}
                style={[styles.agreeRow, errors.agree ? { borderWidth: 1.5, borderColor: t.colors.error, borderRadius: 10, padding: 8 } : null]}
                onPress={() => setAgree((a) => !a)}
              >
                <Ionicons name={agree ? "checkbox" : "square-outline"} size={20} color={errors.agree ? t.colors.error : t.colors.brandDark} />
                <Text style={[t.typography.small, { color: t.colors.text, marginLeft: 8, flex: 1 }]}>
                  I confirm that all the details are correct.
                </Text>
              </Pressable>
              <FieldError message={errors.agree} />
            </View>
          </View>
        )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderColor: t.colors.border }]}>
        <ActionButton
          title={step === 4 ? "Publish Event" : `Next: ${STEP_LABELS[step]}`}
          onPress={step === 4 ? handlePublish : goNext}
          variant="primary"
          size="lg"
          fullWidth
          loading={saving}
          disabled={saving}
          containerStyle={{ backgroundColor: t.colors.brandDark, borderRadius: t.radii.medium }}
        />
      </View>
      </KeyboardAvoidingView>

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
  reviewSection: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  reviewThumb: { width: 96, height: 96, borderRadius: 10, marginRight: 8 },
  row2: { flexDirection: "row" },
  feeRow: { flexDirection: "row", gap: 24, marginBottom: 16 },
  feeOption: { flexDirection: "row", alignItems: "center" },
  stepperControlRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  stepperBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  stepperBtnError: { borderWidth: 1.5, borderColor: "#EF4444" },
  stepperBtnOff: { opacity: 0.35 },
  stepperBtnText: { fontSize: 20, fontFamily: "Manrope_700Bold" },
  previewCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  previewImage: { width: "100%", height: 160 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  agreeRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1 },
});
