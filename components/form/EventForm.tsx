import { useImageUpload } from "@/lib/cloudinary";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CloudinaryImagePickerField from "../form/CloudinaryImagePickerField";
import { DatePickerField } from "../form/DatePickerField";
import { TimePickerField } from "../form/TimePickerField";
import ActionButton from "../inputs/ActionButton";
import TextField from "../inputs/TextField";

const steps = ["The Event", "Logistics", "Details"];

export default function EventForm({
  onSubmit,
  onBack,
  initialData,
  isEdit,
}: {
  onSubmit: (data: any) => void;
  onBack?: () => void;
  isEdit?: boolean;
  initialData?: {
    banner?: string;
    title?: string;
    description?: string;
    price?: string;
    isFree?: boolean;
    location?: string;
    eventDate?: string;
    eventTime?: string;
    regDeadline?: string;
    minParticipants?: string;
    maxParticipants?: string;
    details?: {
      materials?: boolean;
      refreshments?: boolean;
      freeChildren?: boolean;
      guests?: boolean;
    };
  };
}) {
  const { upload, clearError } = useImageUpload();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    banner: initialData?.banner || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    isFree: initialData?.isFree || false,
    location: initialData?.location || "",
    eventDate: initialData?.eventDate || "",
    eventTime: initialData?.eventTime || "",
    regDeadline: initialData?.regDeadline || "",
    minParticipants: initialData?.minParticipants || "",
    maxParticipants: initialData?.maxParticipants || "",
    details: {
      materials: initialData?.details?.materials || false,
      refreshments: initialData?.details?.refreshments || false,
      freeChildren: initialData?.details?.freeChildren || false,
      guests: initialData?.details?.guests || false,
    },
  });
  const [errors, setErrors] = useState<any>({});

  // Step 1 validation
  const validateStep1 = () => {
    let valid = true;
    let err: any = {};
    if (!form.title.trim() || form.title.trim().length < 5) {
      err.title = "Event title must be at least 5 characters.";
      valid = false;
    }
    if (!form.description.trim() || form.description.trim().length < 20) {
      err.description = "Description must be at least 20 characters.";
      valid = false;
    }
    setErrors(err);
    return valid;
  };

  // Step 2 validation
  const validateStep2 = () => {
    let valid = true;
    let err: any = {};
    if (!form.isFree && !form.price.trim()) {
      err.price = "Price is required unless event is free.";
      valid = false;
    }
    if (!form.location.trim()) {
      err.location = "Location is required.";
      valid = false;
    }
    if (!form.eventDate.trim()) {
      err.eventDate = "Event date is required.";
      valid = false;
    }
    if (!form.eventTime.trim()) {
      err.eventTime = "Event time is required.";
      valid = false;
    }
    if (!form.regDeadline.trim()) {
      err.regDeadline = "Registration deadline is required.";
      valid = false;
    }
    setErrors(err);
    return valid;
  };

  // Step 3 validation
  const validateStep3 = () => {
    let valid = true;
    let err: any = {};
    if (!form.minParticipants.trim()) {
      err.minParticipants = "Minimum participants required.";
      valid = false;
    }
    if (!form.maxParticipants.trim()) {
      err.maxParticipants = "Maximum participants required.";
      valid = false;
    }
    setErrors(err);
    return valid;
  };

  const handleContinue = async () => {
    if (step === 0 && validateStep1()) setStep(1);
    else if (step === 1 && validateStep2()) setStep(2);
    else if (step === 2 && validateStep3()) {
      // Upload banner image to Cloudinary before submitting
      clearError();
      setSubmitting(true);
      try {
        let bannerUrl = form.banner;

        // If banner is a local URI (not already uploaded), upload it
        if (form.banner && !form.banner.startsWith("https://")) {
          const result = await upload(form.banner, "events");
          bannerUrl = result.secure_url;
        }

        // Submit with uploaded banner URL
        const submitForm = { ...form, banner: bannerUrl };
        onSubmit(submitForm);
      } catch {
        setErrors((prev: any) => ({
          ...prev,
          banner: "Banner upload failed. Please try again.",
        }));
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 0 && onBack) onBack();
    else setStep((s) => s - 1);
  };

  // Picker open state (only one at a time)
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 200 : 100}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Stepper */}
        <View style={styles.stepperRow}>
          {steps.map((label, i) => (
            <View key={i} style={styles.stepperItem}>
              <View style={[styles.circle, step === i && styles.activeCircle]}>
                <Text
                  style={[
                    styles.circleText,
                    step === i && styles.activeCircleText,
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
              <Text
                style={[styles.stepLabel, step === i && styles.activeStepLabel]}
              >
                {label}
              </Text>
              {i < steps.length - 1 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>
        {/* Step 1: The Event */}
        {step === 0 && (
          <View>
            <Text style={styles.sectionDesc}>
              Describe your event and upload a banner image to attract
              participants.
            </Text>
            <CloudinaryImagePickerField
              label="Event Banner"
              value={form.banner ? [form.banner] : []}
              onChange={(uris: string[]) => {
                setForm((f) => ({ ...f, banner: uris[0] || "" }));
              }}
              max={1}
              tileSize={96}
              style={styles.imagePickerContainer}
            />
            <TextField
              value={form.title}
              onChangeText={(text) => {
                setForm((f) => ({ ...f, title: text }));
                if (errors.title && text.trim())
                  setErrors((e: any) => ({ ...e, title: undefined }));
              }}
              minLength={5}
              maxLength={30}
              placeholder="e.g., Beginner's Painting Workshop"
              label="Event Title*"
              error={errors.title}
              containerStyle={{ marginTop: 16, marginBottom: 8 }}
            />
            <TextField
              value={form.description}
              onChangeText={(text) => {
                setForm((f) => ({ ...f, description: text }));
                if (errors.description && text.trim().length >= 20)
                  setErrors((e: any) => ({ ...e, description: undefined }));
              }}
              placeholder="Describe the event, what to expect, etc."
              label="Description (min 20 chars)*"
              minLength={20}
              maxLength={2000}
              error={errors.description}
              multiline
              inputStyle={{ minHeight: 80, textAlignVertical: "top" }}
              containerStyle={{ marginTop: 16 }}
            />
          </View>
        )}
        {/* Step 2: Logistics */}
        {step === 1 && (
          <View>
            <Text style={styles.sectionDesc}>
              Set the date, location, and participation goals for your event.
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextField
                value={form.price}
                onChangeText={(text) => {
                  setForm((f) => ({ ...f, price: text }));
                  if (errors.price && (form.isFree || text.trim()))
                    setErrors((e: any) => ({ ...e, price: undefined }));
                }}
                placeholder="e.g., 500"
                label="Price per person (₹)*"
                error={errors.price}
                keyboardType="numeric"
                containerStyle={{ flex: 1, marginRight: 8, marginVertical: 8 }}
                editable={!form.isFree && !isEdit}
              />
              <TouchableOpacity
                style={[styles.checkboxRow, isEdit && { opacity: 0.6 }]}
                onPress={() =>
                  !isEdit &&
                  setForm((f) => ({ ...f, isFree: !f.isFree, price: "" }))
                }
                disabled={isEdit}
              >
                <View
                  style={[
                    styles.checkbox,
                    form.isFree && styles.checkboxChecked,
                  ]}
                />
                <Text style={styles.checkboxLabel}>This is a free event</Text>
              </TouchableOpacity>
            </View>
            <TextField
              value={form.location}
              onChangeText={(text) => {
                setForm((f) => ({ ...f, location: text }));
                if (errors.location && text.trim())
                  setErrors((e: any) => ({ ...e, location: undefined }));
              }}
              placeholder="e.g., Brooklyn Society Clubhouse"
              label="Location*"
              editable={!isEdit}
              error={errors.location}
              containerStyle={{ marginTop: 16, marginBottom: 8 }}
            />
            <View
              style={{ flexDirection: "row", marginTop: 16, marginBottom: 8 }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <DatePickerField
                  label="Event Date*"
                  value={form.eventDate}
                  onChange={(date) => {
                    setForm((f) => ({ ...f, eventDate: date }));
                    if (errors.eventDate)
                      setErrors((e: any) => ({ ...e, eventDate: undefined }));
                    setOpenPicker(null);
                  }}
                  error={errors.eventDate}
                  minimumDate={new Date()}
                  maximumDate={(() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 2);
                    return d;
                  })()}
                  disabled={isEdit}
                  show={openPicker === "eventDate"}
                  setShow={(val) => setOpenPicker(val ? "eventDate" : null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TimePickerField
                  label="Event Time*"
                  value={form.eventTime}
                  onChange={(time) => {
                    setForm((f) => ({ ...f, eventTime: time }));
                    if (errors.eventTime)
                      setErrors((e: any) => ({ ...e, eventTime: undefined }));
                    setOpenPicker(null);
                  }}
                  disabled={isEdit}
                  error={errors.eventTime}
                  show={openPicker === "eventTime"}
                  setShow={(val) => setOpenPicker(val ? "eventTime" : null)}
                />
              </View>
            </View>
            <View style={{ width: "100%" }}>
              <DatePickerField
                label="Registration Deadline*"
                value={form.regDeadline}
                onChange={(date) => {
                  setForm((f) => ({ ...f, regDeadline: date }));
                  if (errors.regDeadline)
                    setErrors((e: any) => ({ ...e, regDeadline: undefined }));
                  setOpenPicker(null);
                }}
                disabled={isEdit}
                error={errors.regDeadline}
                minimumDate={new Date()}
                maximumDate={(() => {
                  if (!form.eventDate) return undefined;
                  const d = new Date(form.eventDate);
                  d.setDate(d.getDate() - 2);
                  return d;
                })()}
                modalContentStyle={{
                  minWidth: "100%",
                  maxWidth: "100%",
                  marginHorizontal: 16,
                }}
                helpText="Must be at least 2 days before the event date"
                show={openPicker === "regDeadline"}
                setShow={(val) => setOpenPicker(val ? "regDeadline" : null)}
              />
            </View>
          </View>
        )}
        {/* Step 3: Details */}
        {step === 2 && (
          <View>
            <Text style={styles.sectionDesc}>
              Set participation limits and add final details to inform your
              guests.
            </Text>
            <View style={{ flexDirection: "row" }}>
              <TextField
                value={form.minParticipants}
                onChangeText={(text) => {
                  setForm((f) => ({ ...f, minParticipants: text }));
                  if (errors.minParticipants && text.trim())
                    setErrors((e: any) => ({
                      ...e,
                      minParticipants: undefined,
                    }));
                }}
                editable={!isEdit}
                placeholder="e.g., 10"
                label="Min. Participants*"
                keyboardType="numeric"
                error={errors.minParticipants}
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <TextField
                value={form.maxParticipants}
                onChangeText={(text) => {
                  setForm((f) => ({ ...f, maxParticipants: text }));
                  const minVal = parseInt(form.minParticipants, 10);
                  const maxVal = parseInt(text, 10);
                  if (
                    text.trim() &&
                    form.minParticipants.trim() &&
                    !isNaN(minVal) &&
                    !isNaN(maxVal) &&
                    maxVal < minVal
                  ) {
                    setErrors((e: any) => ({
                      ...e,
                      maxParticipants:
                        "Max. Participants cannot be less than Min. Participants.",
                    }));
                  } else if (errors.maxParticipants) {
                    setErrors((e: any) => ({
                      ...e,
                      maxParticipants: undefined,
                    }));
                  }
                }}
                editable={!isEdit}
                placeholder="e.g., 25"
                label="Max. Participants*"
                keyboardType="numeric"
                error={errors.maxParticipants}
                containerStyle={{ flex: 1 }}
              />
            </View>
            <View style={styles.detailsGrid}>
              <TouchableOpacity
                style={[styles.detailCheckboxRow, isEdit && { opacity: 0.6 }]}
                onPress={() =>
                  !isEdit &&
                  setForm((f) => ({
                    ...f,
                    details: { ...f.details, materials: !f.details.materials },
                  }))
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    form.details.materials && styles.checkboxChecked,
                  ]}
                />
                <Text style={styles.checkboxLabel}>All materials provided</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.detailCheckboxRow, isEdit && { opacity: 0.6 }]}
                onPress={() =>
                  !isEdit &&
                  setForm((f) => ({
                    ...f,
                    details: {
                      ...f.details,
                      refreshments: !f.details.refreshments,
                    },
                  }))
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    form.details.refreshments && styles.checkboxChecked,
                  ]}
                />
                <Text style={styles.checkboxLabel}>
                  Refreshments will be served
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.detailCheckboxRow, isEdit && { opacity: 0.6 }]}
                onPress={() =>
                  !isEdit &&
                  setForm((f) => ({
                    ...f,
                    details: {
                      ...f.details,
                      freeChildren: !f.details.freeChildren,
                    },
                  }))
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    form.details.freeChildren && styles.checkboxChecked,
                  ]}
                />
                <Text style={styles.checkboxLabel}>
                  Free for children under 10
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.detailCheckboxRow, isEdit && { opacity: 0.6 }]}
                onPress={() =>
                  !isEdit &&
                  setForm((f) => ({
                    ...f,
                    details: { ...f.details, guests: !f.details.guests },
                  }))
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    form.details.guests && styles.checkboxChecked,
                  ]}
                />
                <Text style={styles.checkboxLabel}>Guests are welcome</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Navigation Buttons */}
        <View style={styles.buttonRow}>
          {step !== 0 && (
            <ActionButton
              title="Back"
              onPress={handleBack}
              variant="outline"
              containerStyle={styles.backButton}
              disabled={submitting}
            />
          )}
          <ActionButton
            title={step === 2 ? "Publish Event" : "Continue"}
            onPress={handleContinue}
            containerStyle={styles.continueButton}
            disabled={submitting}
            loading={submitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  imagePickerContainer: {
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    elevation: 0,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  stepperItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  activeCircle: {
    borderColor: "#F97316",
    backgroundColor: "#F97316",
  },
  circleText: {
    color: "#6B7280",
    fontWeight: "bold",
  },
  activeCircleText: {
    color: "#fff",
  },
  stepLabel: {
    marginLeft: 6,
    marginRight: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  activeStepLabel: {
    color: "#F97316",
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 2,
  },
  sectionDesc: {
    backgroundColor: "#FFF7ED",
    color: "#F97316",
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  checkboxLabel: {
    color: "#6B7280",
    fontSize: 13,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
  },
  detailCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    marginBottom: 16,
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  continueButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#F97316",
  },
});
