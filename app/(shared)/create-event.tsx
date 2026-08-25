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

const CLOSES_OPTIONS = [
  { id: "1", name: "1 hour before event" },
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
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  // Step 3
  const [participationType, setParticipationType] = useState<ParticipationType>("free");
  const [feeAmount, setFeeAmount] = useState("");
  const [minParticipants, setMinParticipants] = useState(0);
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [closesHours, setClosesHours] = useState("3");
  const [rules, setRules] = useState("");
  const [agree, setAgree] = useState(false);

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  const next1 = () => {
    if (title.trim().length < 3) return showToast("Enter an event title", "error");
    if (!eventType) return showToast("Select an event type", "error");
    if (description.trim().length < 5) return showToast("Add a short description", "error");
    setStep(2);
  };

  const next2 = () => {
    if (!startDate) return showToast("Start date is required", "error");
    if (!venue.trim()) return showToast("Venue is required", "error");
    setStep(3);
  };

  const next3 = () => {
    if (participationType === "paid" && (!feeAmount || Number(feeAmount) <= 0)) {
      return showToast("Enter a valid participation fee", "error");
    }
    if (minParticipants > maxParticipants) {
      return showToast("Minimum cannot exceed maximum participants", "error");
    }
    setStep(4);
  };

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
      maximumparticipants: maxParticipants,
      registrationclosesbefore: Number(closesHours),
      ...(rules.trim() ? { rulesthingstobring: rules.trim() } : {}),
    };
    try {
      const img = image[0] && !image[0].startsWith("http")
        ? { uri: image[0], name: "event.jpg", type: "image/jpeg" }
        : null;
      const created = await createEvent(payload, img);
      setPublished({ id: created.id });
    } catch (e: any) {
      showToast(e?.message ?? "Failed to publish event", "error");
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.headerRow}>
        <Pressable onPress={goBack} hitSlop={12}>
          <Ionicons name="close" size={26} color={t.colors.text} />
        </Pressable>
        <Heading level={3}>Create Event</Heading>
        <View style={{ width: 26 }} />
      </View>

      {/* Stepper */}
      
      <Text style={[t.typography.h4, { color: t.colors.brandDark, textAlign: "center", fontWeight: "700", marginBottom: 8, marginTop: 15 }]}>
        {STEP_LABELS[step - 1]}
      </Text>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View>
            <GlobalInput label="Event Title *" placeholder="e.g. Weekend Cricket Match" value={title} onChangeText={setTitle} maxLength={80} />
            <Select label="Event Type *" options={EVENT_TYPES} selectedId={eventType} onChange={setEventType} placeholder="Select event type" leftIcon="pricetag-outline" />
            <GlobalInput label="Description *" placeholder="Tell your neighbours what this event is about…" value={description} onChangeText={setDescription} maxLength={300} multiline numberOfLines={4} />
            <ImagePickerField label="Event Image (Optional)" mode="single" value={image} onChange={setImage} max={1} />
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
            <View style={styles.row2}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <DatePickerField label="End Date" value={endDate} onChange={(d) => { setEndDate(d); setOpenPicker(null); }} minimumDate={startDate ? new Date(startDate) : new Date()} show={openPicker === "end"} setShow={(v) => setOpenPicker(v ? "end" : null)} />
              </View>
              <View style={{ flex: 1 }}>
                <TimePickerField label="End Time" value={endTime} onChange={(v) => { setEndTime(v); setOpenPicker(null); }} show={openPicker === "endTime"} setShow={(v) => setOpenPicker(v ? "endTime" : null)} />
              </View>
            </View>

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
              <Pressable style={styles.stepperBtn} onPress={() => setMinParticipants((v) => Math.max(0, v - 1))}><Text style={styles.stepperBtnText}>−</Text></Pressable>
              <Text style={[t.typography.h4, { color: t.colors.text, width: 48, textAlign: "center" }]}>{minParticipants}</Text>
              <Pressable style={styles.stepperBtn} onPress={() => setMinParticipants((v) => v + 1)}><Text style={styles.stepperBtnText}>+</Text></Pressable>
            </View>

            <Label>Maximum Participants *</Label>
            <View style={styles.stepperControlRow}>
              <Pressable style={styles.stepperBtn} onPress={() => setMaxParticipants((v) => Math.max(1, v - 1))}><Text style={styles.stepperBtnText}>−</Text></Pressable>
              <Text style={[t.typography.h4, { color: t.colors.text, width: 48, textAlign: "center" }]}>{maxParticipants}</Text>
              <Pressable style={styles.stepperBtn} onPress={() => setMaxParticipants((v) => v + 1)}><Text style={styles.stepperBtnText}>+</Text></Pressable>
            </View>

            <Select label="Registration Closes *" options={CLOSES_OPTIONS} selectedId={closesHours} onChange={setClosesHours} leftIcon="time-outline" />
            <GlobalInput label="Rules / Things to Bring (Optional)" placeholder="Add any rules, guidelines or things participants should bring…" value={rules} onChangeText={setRules} maxLength={250} multiline numberOfLines={3} />
          </View>
        )}

        {step === 4 && (
          <View>
            <View style={[styles.previewCard, { borderColor: t.colors.border, backgroundColor: t.colors.cardBackground }]}>
              {image[0] ? (
                <Image source={{ uri: image[0] }} style={styles.previewImage} contentFit="cover" />
              ) : null}
              <View style={{ padding: 12 }}>
                {eventType ? <Chip label={eventType} variant="selected" style={{ marginBottom: 6 }} /> : null}
                <Heading level={4}>{title}</Heading>
                <Text style={[t.typography.body, { color: t.colors.secondaryText, marginTop: 4 }]}>{description}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={14} color={t.colors.secondaryText} />
                  <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 4 }]}>{startDate}</Text>
                  {startTime ? <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 10 }]}>{startTime}</Text> : null}
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={t.colors.secondaryText} />
                  <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 4 }]}>{venue}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="people-outline" size={14} color={t.colors.secondaryText} />
                  <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 4 }]}>
                    {maxParticipants} Max Participants
                  </Text>
                  <Chip label={participationType === "free" ? "Free" : `₹${feeAmount}`} variant="success" style={{ marginLeft: "auto" }} />
                </View>
              </View>
            </View>

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
        onClose={() => router.replace("/(tabs)/home")}
        title="Your event is live!"
        subtitle={`${title} has been published successfully.`}
        primaryActionLabel="Go to Event Dashboard"
        onPrimaryAction={() => {
          if (published) router.replace({ pathname: "/(shared)/event-dashboard", params: { eventId: String(published.id) } });
        }}
        secondaryActionLabel="Back to Home"
        onSecondaryAction={() => router.replace("/(tabs)/home")}
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
  row2: { flexDirection: "row" },
  feeRow: { flexDirection: "row", gap: 24, marginBottom: 16 },
  feeOption: { flexDirection: "row", alignItems: "center" },
  stepperControlRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  stepperBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  stepperBtnText: { fontSize: 20, fontWeight: "700" },
  previewCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  previewImage: { width: "100%", height: 160 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  agreeRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1 },
});
