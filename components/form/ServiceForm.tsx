import {
  DAILYHELP_CAT_MOCK,
  DAY_PRESETS,
  SERVICE_TYPE_OPTIONS,
  SERVICES_CAT_MOCK,
} from "@/assets/mocks/category";
import { useImageUpload } from "@/lib/cloudinary";
import type {
  DailyHelper,
  PricingRow,
  WorkingHour,
} from "@/types/business.type";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import InfoBanner from "../UI/InfoBanner";
import SelectField from "../form/dropdown";
import ActionButton from "../inputs/ActionButton";
import TextField from "../inputs/TextField";
import CircularImage from "./CircularImage";

type ServiceFormData = {
  name: string;
  description: string;
  phone: string;
  categoryId: string;
  images: string[];
  serviceType: string;
  address: string;
  rate: string;
  additionalInfo: string;
  workingHours: WorkingHour[];
};

interface ServiceFormProps {
  onSubmit: (data: Partial<DailyHelper>) => void;
}

export default function ServiceForm({ onSubmit }: ServiceFormProps) {
  const [step, setStep] = useState<number>(0);
  const [selectedDayPreset, setSelectedDayPreset] = useState<
    string | undefined
  >();
  const [showStartTimePicker, setShowStartTimePicker] =
    useState<boolean>(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Date>(new Date(2000, 0, 1, 9, 0));
  const [endTime, setEndTime] = useState<Date>(new Date(2000, 0, 1, 17, 0));
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [pricingRows, setPricingRows] = useState<PricingRow[]>([
    { rate: "", subtext: "" },
  ]);

  const [form, setForm] = useState<ServiceFormData>({
    name: "",
    description: "",
    phone: "",
    categoryId: "",
    images: [""],
    serviceType: "",
    address: "",
    rate: "",
    additionalInfo: "",
    workingHours: [],
  });
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { upload } = useImageUpload();

  // Stepper labels - conditionally show 3 steps for Professional Services, 2 for Daily Help
  const stepLabels = useMemo(
    () =>
      form.serviceType === "professional-services"
        ? ["Service Info", "Details & Image", "Working Hours"]
        : ["Service Info", "Details & Image"],
    [form.serviceType]
  );

  const validateStep1 = useCallback((): boolean => {
    let valid = true;
    const err: Record<string, string> = {};
    if (!form.name.trim()) {
      err.name = "Full name is required.";
      valid = false;
    }
    if (form.name.trim().length < 3 || form.name.trim().length > 30) {
      err.name = "Full name must be between 3 and 30 characters.";
      valid = false;
    }
    if (!form.serviceType) {
      err.serviceType = "Service type is required.";
      valid = false;
    }
    if (!form.categoryId) {
      err.categoryId = "Category is required.";
      valid = false;
    }
    if (!form.phone.trim()) {
      err.phone = "Business phone is required.";
      valid = false;
    } else if (form.phone.length !== 10) {
      err.phone = "Business phone must be exactly 10 digits.";
      valid = false;
    }
    setErrors(err);
    return valid;
  }, [form]);

  const handlePhoneChange = useCallback((text: string) => {
    const digitsOnly = text.replace(/\D/g, "");
    const limitedDigits = digitsOnly.slice(0, 10);
    setForm((prev) =>
      prev.phone === limitedDigits ? prev : { ...prev, phone: limitedDigits }
    );
  }, []);

  const validateStep2 = useCallback((): boolean => {
    let valid = true;
    const err: Record<string, string> = {};
    if (form.serviceType === "professional-services") {
      if (!form.rate || isNaN(Number(form.rate))) {
        err.rate = "Valid rate is required.";
        valid = false;
      }
      if (!form.additionalInfo.trim()) {
        err.additionalInfo = "Additional info/specialty is required.";
        valid = false;
      }
    }
    if (form.serviceType === "daily-help") {
      const allRowsFilled = pricingRows.every(
        (row) => row.rate.trim() && row.subtext.trim()
      );
      if (!allRowsFilled) {
        err.pricingRows = "All pricing rows must be filled.";
        valid = false;
      }
    }
    setErrors(err);
    return valid;
  }, [form, pricingRows, avatarUri]);

  const validateStep3 = useCallback((): boolean => {
    let valid = true;
    const err: Record<string, string> = {};
    if (form.serviceType === "professional-services") {
      if (!form.workingHours || form.workingHours.length === 0) {
        err.workingHours = "At least one working hour slot is required.";
        valid = false;
      }
    }
    setErrors(err);
    return valid;
  }, [form]);

  const handleSubmitWithImageUpload = useCallback(
    async (serviceType: string) => {
      setSubmitting(true);
      try {
        let uploadedImageUrl = avatarUri;
        if (avatarUri && !avatarUri.startsWith("https://")) {
          const result = await upload(avatarUri, "profiles");
          uploadedImageUrl = result.secure_url;
        }
        const basePayload: Partial<DailyHelper> = {
          name: form.name,
          description: form.description,
          phone: form.phone ? `+91${form.phone}` : "",
          categoryId: form.categoryId,
          images: uploadedImageUrl ? [uploadedImageUrl] : [""],
          address: form.address,
          serviceType: form.serviceType,
          additionalInfo: form.additionalInfo,
        };
        let payload: Partial<DailyHelper> = basePayload;
        if (serviceType === "professional-services") {
          payload = {
            ...basePayload,
            rate: form.rate,
            // The API/type expects a single WorkingHour object (not an array),
            // so send the first entry or undefined if none.
            workingHours:
              form.workingHours && form.workingHours.length > 0
                ? form.workingHours[0]
                : undefined,
            // move additional info into description to match DailyHelper type
            description: form.description,
          };
        } else if (serviceType === "daily-help") {
          payload = {
            ...basePayload,
            pricingRates: pricingRows,
          };
        }
        onSubmit(payload);
      } catch {
        setErrors((prev) => {
          const { avatar, ...rest } = prev;
          return {
            ...rest,
            avatar: "Failed to upload image. Please try again.",
          };
        });
      } finally {
        setSubmitting(false);
      }
    },
    [avatarUri, form, upload, onSubmit, pricingRows]
  );

  const handleContinue = useCallback(async () => {
    if (step === 0) {
      if (validateStep1()) setStep(1);
    } else if (step === 1) {
      if (!validateStep2()) return;
      if (form.serviceType === "professional-services") {
        setStep(2);
      } else {
        await handleSubmitWithImageUpload("daily-help");
      }
    } else if (step === 2) {
      if (!validateStep3()) return;
      await handleSubmitWithImageUpload("professional-services");
    }
  }, [
    step,
    validateStep1,
    validateStep2,
    validateStep3,
    form.serviceType,
    handleSubmitWithImageUpload,
  ]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const onChangeAvatar = useCallback((uri: string) => {
    setAvatarUri(uri);
    setErrors((e) => {
      const { avatar, ...rest } = e;
      return rest;
    });
  }, []);

  // Stepper component function
  const renderStepper = useCallback(
    () => (
      <View style={styles.stepperRow}>
        {stepLabels.map((label, i) => (
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
            {i < stepLabels.length - 1 && <View style={styles.stepLine} />}
          </View>
        ))}
      </View>
    ),
    [stepLabels, step]
  );

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      {/* Stepper (identical look to BusinessForm) */}
      {renderStepper()}

      {step === 0 && (
        <>
          <InfoBanner
            title="Add your service to the directory after admin approval."
            backgroundColor="#FFF7ED"
            borderColor="#15803D"
            titleColor="#F97316"
          />
          <TextField
            value={form.name}
            onChangeText={(text) => {
              setForm((f) => ({ ...f, name: text }));
              if (errors.name && text.trim())
                setErrors((e: any) => ({ ...e, name: undefined }));
            }}
            placeholder="e.g., Sunita Devi"
            label="Full Name*"
            minLength={3}
            maxLength={30}
            error={errors.name}
            containerStyle={{ marginBottom: 16 }}
          />
          <SelectField
            label="Choose a Service*"
            options={SERVICE_TYPE_OPTIONS}
            selectedId={form.serviceType}
            onChange={(val) => {
              // Reset category when service type changes
              setForm((f) => ({
                ...f,
                serviceType: val,
                categoryId: "",
                rate: "",
                subtext: "",
                workingHours: [],
              }));
              setSelectedDayPreset(undefined);
              setPricingRows([{ rate: "", subtext: "" }]);
              // Reset to step 1 if switching service types
              if (step > 1) {
                setStep(1);
              }
              if (errors.serviceType && val)
                setErrors((e: any) => ({
                  ...e,
                  serviceType: undefined,
                  categoryId: undefined,
                }));
            }}
            placeholder="Choose a service"
            modalTitle="Choose service"
            style={{ marginBottom: 16 }}
            error={!!errors.serviceType}
          />
          {form.serviceType && (
            <SelectField
              label="Select Category*"
              options={
                form.serviceType === "daily-help"
                  ? DAILYHELP_CAT_MOCK
                  : SERVICES_CAT_MOCK
              }
              selectedId={form.categoryId}
              onChange={(val) => {
                setForm((f) => ({ ...f, categoryId: val }));
                if (errors.categoryId && val)
                  setErrors((e: any) => ({ ...e, categoryId: undefined }));
              }}
              placeholder={
                form.serviceType
                  ? "Choose a category"
                  : "Select a service first"
              }
              modalTitle="Choose category"
              style={{ marginBottom: 16 }}
              error={!!errors.categoryId}
            />
          )}
          <TextField
            value={form.phone}
            onChangeText={handlePhoneChange}
            placeholder="e.g., 9876543210"
            keyboardType="phone-pad"
            label="Contact Number*"
            error={errors.phone}
            containerStyle={{ marginBottom: 16 }}
            required
            maxLength={10}
          />
          <TextField
            value={form.description}
            onChangeText={(text) =>
              setForm((f) => ({ ...f, description: text }))
            }
            placeholder="Add a brief description of the service"
            label="Description (Optional)"
            multiline
            inputStyle={{ minHeight: 60, maxHeight: 70 , textAlignVertical: "top" }}
            containerStyle={{ marginBottom: 24 }}
          />
        </>
      )}

      {step === 1 && (
        <>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <CircularImage
              uri={avatarUri ?? undefined}
              mode="edit"
              onChange={onChangeAvatar}
              size={100}
              loading={false}
            />
          </View>
          <TextField
            value={form.address}
            onChangeText={(text) => setForm((f) => ({ ...f, address: text }))}
            placeholder="e.g., Shop #4, near the main gate"
            label="Address (Optional)"
            containerStyle={{ marginBottom: 16 }}
          />

          {/* Professional Services Fields */}
          {form.serviceType === "professional-services" && (
            <>
              <TextField
                value={form.rate}
                onChangeText={(text) => {
                  const digits = text.replace(/[^0-9.]/g, "");
                  setForm((f) => ({ ...f, rate: digits }));
                  if (errors.rate)
                    setErrors((e: any) => ({ ...e, rate: undefined }));
                }}
                placeholder="e.g., 800"
                keyboardType="decimal-pad"
                label="Rate*"
                error={errors.rate}
                containerStyle={{ marginBottom: 16 }}
              />
              <TextField
                value={form.additionalInfo}
                onChangeText={(text) => {
                  setForm((f) => ({ ...f, additionalInfo: text }));
                  if (errors.additionalInfo)
                    setErrors((e: any) => ({
                      ...e,
                      additionalInfo: undefined,
                    }));
                }}
                placeholder="e.g., Pediatrician with 10 years experience"
                label="Specialty/Description*"
                error={errors.additionalInfo}
                multiline
                inputStyle={{ minHeight: 60, textAlignVertical: "top" }}
                containerStyle={{ marginBottom: 16 }}
              />
            </>
          )}

          {/* Daily Help Pricing Rows */}
          {form.serviceType === "daily-help" && (
            <>
              <Text style={[styles.labelText, { marginBottom: 8 }]}>
                Pricing Rates*
              </Text>
              {pricingRows.map((row, index) => (
                <View key={index} style={{ marginBottom: 16 }}>
                  <View
                    style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}
                  >
                    <TextField
                      value={row.rate}
                      onChangeText={(text) => {
                        const digits = text.replace(/[^0-9.]/g, "");
                        const newRows = [...pricingRows];
                        newRows[index] = { ...newRows[index], rate: digits };
                        setPricingRows(newRows);
                        if (errors.pricingRows)
                          setErrors((e: any) => ({
                            ...e,
                            pricingRows: undefined,
                          }));
                      }}
                      placeholder="Rate"
                      keyboardType="decimal-pad"
                      containerStyle={{ flex: 1, marginBottom: 0 }}
                    />
                    <TextField
                      value={row.subtext}
                      onChangeText={(text) => {
                        const newRows = [...pricingRows];
                        newRows[index] = { ...newRows[index], subtext: text };
                        setPricingRows(newRows);
                        if (errors.pricingRows)
                          setErrors((e: any) => ({
                            ...e,
                            pricingRows: undefined,
                          }));
                      }}
                      placeholder="Description"
                      containerStyle={{ flex: 1.2, marginBottom: 0 }}
                    />
                  </View>
                </View>
              ))}
              {!!errors.pricingRows && (
                <Text style={styles.errorText}>{errors.pricingRows}</Text>
              )}
              <Pressable
                style={styles.addRowButton}
                onPress={() => {
                  setPricingRows([...pricingRows, { rate: "", subtext: "" }]);
                }}
              >
                <Ionicons name="add-circle" size={18} color="#F97316" />
                <Text style={styles.addRowButtonText}>Add Row</Text>
              </Pressable>
            </>
          )}
        </>
      )}

      {/* Step 2: Working Hours (Professional Services Only) */}
      {step === 2 && form.serviceType === "professional-services" && (
        <>
          <Text style={[styles.labelText, { marginBottom: 12 }]}>
            Working Hours*
          </Text>

          {/* Display selected working hours */}
          {form.workingHours.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              {form.workingHours.map((slot, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#F3F4F6",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#1F2937",
                      fontWeight: "500",
                    }}
                  >
                    {slot.displayText}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setForm((f) => ({
                        ...f,
                        workingHours: f.workingHours.filter(
                          (_, i) => i !== index
                        ),
                      }));
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Day Presets */}
          <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>
            Select Days
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {DAY_PRESETS.map((day) => (
              <Pressable
                key={day.id}
                onPress={() => {
                  setSelectedDayPreset(day.id);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor:
                    selectedDayPreset === day.id ? "#F97316" : "#D1D5DB",
                  backgroundColor:
                    selectedDayPreset === day.id ? "#FFF7ED" : "#fff",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: selectedDayPreset === day.id ? "#F97316" : "#6B7280",
                    fontWeight: selectedDayPreset === day.id ? "600" : "500",
                  }}
                >
                  {day.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Time Slots */}
          <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>
            Select Time Slot
          </Text>

          {/* Time Picker Section */}
          {selectedDayPreset && (
            <View style={{ marginBottom: 16 }}>
              {/* Start Time Picker */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ marginBottom: 12, flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#1F2937",
                      fontWeight: "500",
                      marginBottom: 8,
                    }}
                  >
                    From
                  </Text>
                  <Pressable
                    onPress={() => setShowStartTimePicker(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      backgroundColor: "#fff",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#1F2937" }}>
                      {startTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                    <Ionicons name="time" size={18} color="#F97316" />
                  </Pressable>
                  {showStartTimePicker && (
                    <DateTimePicker
                      value={startTime}
                      mode="time"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setStartTime(selectedDate);
                        }
                        setShowStartTimePicker(false);
                      }}
                    />
                  )}
                </View>

                {/* End Time Picker */}
                <View style={{ marginBottom: 12, flex: 1, marginLeft: 8 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#1F2937",
                      fontWeight: "500",
                      marginBottom: 8,
                    }}
                  >
                    To
                  </Text>
                  <Pressable
                    onPress={() => setShowEndTimePicker(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      backgroundColor: "#fff",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#1F2937" }}>
                      {endTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                    <Ionicons name="time" size={18} color="#F97316" />
                  </Pressable>
                  {showEndTimePicker && (
                    <DateTimePicker
                      value={endTime}
                      mode="time"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setEndTime(selectedDate);
                        }
                        setShowEndTimePicker(false);
                      }}
                    />
                  )}
                </View>
              </View>
              {/* Add Button */}
              <Pressable
                onPress={() => {
                  if (selectedDayPreset) {
                    const dayLabel =
                      DAY_PRESETS.find((d) => d.id === selectedDayPreset)
                        ?.name || "";
                    const startTimeStr = startTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });
                    const endTimeStr = endTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });
                    const displayText = `${dayLabel}: ${startTimeStr} - ${endTimeStr}`;

                    setForm((f) => ({
                      ...f,
                      workingHours: [
                        ...f.workingHours,
                        {
                          dayPreset: selectedDayPreset,
                          timeSlot: `${startTime.getHours()}:${startTime
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}-${endTime.getHours()}:${endTime
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}`,
                          displayText,
                        },
                      ],
                    }));
                    setSelectedDayPreset(undefined);
                    // Reset time pickers
                    setStartTime(new Date(2000, 0, 1, 9, 0));
                    setEndTime(new Date(2000, 0, 1, 17, 0));
                  }
                }}
                style={{
                  backgroundColor: "#F97316",
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Add Working Hours
                </Text>
              </Pressable>
            </View>
          )}

          {!!errors.workingHours && (
            <Text style={styles.errorText}>{errors.workingHours}</Text>
          )}
        </>
      )}

      {/* Navigation Buttons */}
      <View style={{ flexDirection: "row", marginTop: 24, gap: 12 }}>
        {step > 0 && (
          <ActionButton
            title="Back"
            onPress={handleBack}
            variant="outline"
            fullWidth
            containerStyle={styles.backButton}
          />
        )}
        <ActionButton
          title={
            step === 0
              ? "Continue"
              : step === 1
              ? form.serviceType === "professional-services"
                ? "Continue to Working Hours"
                : "Submit Service"
              : "Submit Service"
          }
          onPress={handleContinue}
          fullWidth
          containerStyle={styles.continueButton}
          disabled={submitting}
          loading={submitting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#22223B",
  },
  errorText: {
    color: "#EF4444",
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  continueButton: {
    flex: 1,
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  stepperItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  activeCircle: {
    backgroundColor: "#F97316",
  },
  circleText: {
    color: "#6B7280",
    fontWeight: "700",
    fontSize: 15,
  },
  activeCircleText: {
    color: "#fff",
  },
  stepLabel: {
    marginLeft: 8,
    marginRight: 8,
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 14,
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
  backButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  labelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  addRowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 6,
  },
  addRowButtonText: {
    color: "#F97316",
    fontWeight: "600",
    fontSize: 14,
  },
});
