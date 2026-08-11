import { BUSINESS_TIMINGS_OPTIONS } from "@/assets/mocks/category";
import { usePermissions } from "@/hooks/usePermissions";
import { useImageUpload } from "@/lib/cloudinary";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import type { BusinessCategory } from "@/types/business.type";
import { UserRole } from "@/types/roles";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ActionButton from "../inputs/ActionButton";
import TextField from "../inputs/TextField";
import InfoBanner from "../UI/InfoBanner";
import CloudinaryImagePickerField from "./CloudinaryImagePickerField";
import SelectField from "./dropdown";

interface BusinessFormProps {
  categories: BusinessCategory[];
  onSubmit?: (data: BusinessFormData) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
  initialData?: Partial<BusinessFormData>;
  submitLabel?: string;
}

export type BusinessFormData = {
  title: string;
  category?: string;
  description?: string;
  businessPhone?: string;
  email?: string;
  gstNumber?: string;
  address: string;
  unit?: string;
  price?: number;
  images?: string[];
  profilePhotoUrl?: string;
  shopTimings?: BusinessCategory;
  businessFor?: "self" | "other";
};

export default function BusinessForm({
  categories,
  onSubmit,
  loading = false,
  error,
  onBack,
  initialData,
  submitLabel,
}: BusinessFormProps) {
  const t = useTheme();
  const userPhone = useUserStore((state) => state.user?.phone);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BusinessFormData>(() => ({
    title: initialData?.title ?? "",
    category: initialData?.category ?? "",
    description: initialData?.description ?? "",
    businessPhone: initialData?.businessPhone ?? userPhone ?? "",
    email: initialData?.email ?? "",
    gstNumber: initialData?.gstNumber ?? "",
    address: initialData?.address ?? "",
    unit: initialData?.unit ?? "",
    shopTimings: initialData?.shopTimings ?? undefined,
    businessFor: initialData?.businessFor ?? undefined,
    price:
      typeof initialData?.price === "string"
        ? Number(initialData?.price)
        : (initialData?.price ?? 0),
    images: initialData?.images ?? [],
    profilePhotoUrl: initialData?.profilePhotoUrl ?? undefined,
  }));
  const [errors, setErrors] = useState<
    Partial<Record<keyof BusinessFormData, string>>
  >({});
  const { upload, clearError } = useImageUpload();
  const [submitting, setSubmitting] = useState(false);
  const { hasRole } = usePermissions();

  useEffect(() => {
    if (userPhone) {
      setForm((f) => ({ ...f, businessPhone: f.businessPhone || userPhone }));
    }
  }, [userPhone]);

  // Always keep a ref to the latest form so async handlers never read stale state
  const formRef = useRef(form);
  formRef.current = form;

  // Stepper labels
  const stepLabels = ["Business Info", "Business Details"];

  // Step 1 validation
  const validateStep1 = () => {
    let valid = true;
    const err: Partial<Record<keyof BusinessFormData, string>> = {};
    if (!form.title.trim()) {
      err.title = "Business title is required.";
      valid = false;
    }
    if (!form.category) {
      err.category = "Category is required.";
      valid = false;
    }
    if (!form.businessPhone?.trim()) {
      err.businessPhone = "Business phone is required.";
      valid = false;
    } else if (form.businessPhone.length !== 13) {
      err.businessPhone = "Business phone must be exactly 13 digits.";
      valid = false;
    }
    setErrors(err);
    return valid;
  };

  // Step 2 validation (at least 1 image)
  const validateStep2 = () => {
    let valid = true;
    const err: Partial<Record<keyof BusinessFormData, string>> = {};
    // Validate email if provided (optional field)
    if (form.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        err.email = "Please enter a valid email address";
        valid = false;
      }
    }
    // Validate GST number if provided (optional field)
    if (form.gstNumber?.trim()) {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(form.gstNumber.trim().toUpperCase())) {
        err.gstNumber =
          "Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)";
        valid = false;
      }
    }
    setErrors(err);
    return valid;
  };

  const handleChangeImages = useCallback((images: string[]) => {
    setForm((prev) => ({ ...prev, images }));
  }, []);

  // Handle business phone input - only allow 13 digits
  const handleBusinessPhoneChange = useCallback((text: string) => {
    // Remove any non-digit characters
    const digitsOnly = text.replace(/\D/g, "");
    // Limit to 13 digits
    const limitedDigits = digitsOnly.slice(0, 13);
    setForm((prev) => ({ ...prev, businessPhone: limitedDigits }));
  }, []);

  // Stepper navigation
  const handleContinue = async () => {
    if (step === 0 && validateStep1()) setStep(1);
    else if (step === 1 && validateStep2()) {
      // Upload local images to Cloudinary
      clearError();
      setSubmitting(true);
      // Capture latest form via ref — avoids stale closure after async awaits
      const currentForm = formRef.current;
      try {
        // Filter out already uploaded images (URLs) from local images (URIs)
        const localImages = (currentForm.images ?? []).filter(
          (img) => !img.startsWith("https://"),
        );
        let uploadedUrls: string[] = [];

        // Upload each local image
        for (const localUri of localImages) {
          const result = await upload(localUri, "businesses");
          uploadedUrls.push(result.secure_url);
        }

        // Combine already uploaded images with newly uploaded ones
        const finalImages = [
          ...(currentForm.images ?? []).filter((img) =>
            img.startsWith("https://"),
          ),
          ...uploadedUrls,
        ];

        // Submit with uploaded images
        const submitForm = { ...currentForm, images: finalImages };
        if (onSubmit) onSubmit(submitForm);
      } catch {
        setErrors((prev) => ({
          ...prev,
          images: "Image upload failed. Please try again.",
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

  // Stepper UI
  const stepper = (
    <View style={styles.stepperRow}>
      {stepLabels.map((label, i) => (
        <View key={i} style={styles.stepperItem}>
          <View style={[styles.circle, step === i && styles.activeCircle]}>
            <Text
              style={[styles.circleText, step === i && styles.activeCircleText]}
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
  );

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
    >
      {stepper}
      {step === 0 && (
        <>
          <InfoBanner
            title="Get listed in the community marketplace after admin approval and unlock the option to add your business catalog."
            backgroundColor={t.colors.lightBackground}
            borderColor={t.colors.primary}
            titleColor={t.colors.themeTextColor}
          />
          <TextField
            label="Business Title*"
            placeholder="e.g., Fresh Bakes Bakery"
            value={form.title}
            onChangeText={(text) => setForm((f) => ({ ...f, title: text }))}
            error={errors.title}
            required
            containerStyle={{ marginVertical: 8 }}
          />
          <SelectField
            label="Category*"
            options={categories}
            selectedId={form.category ?? null}
            onChange={(id) => setForm((f) => ({ ...f, category: id }))}
            error={!!errors.category}
            placeholder="Select a category"
            style={{ marginVertical: 8 }}
          />
          {!!errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
          <TextField
            label="Business Phone*"
            placeholder="e.g., +919876543210"
            value={form.businessPhone}
            onChangeText={handleBusinessPhoneChange}
            error={errors.businessPhone}
            required
            keyboardType="phone-pad"
            maxLength={13}
            editable={false}
            containerStyle={{ marginVertical: 8 }}
          />
          <SelectField
            label="Timings*"
            options={BUSINESS_TIMINGS_OPTIONS}
            selectedId={form.shopTimings?.id ?? null}
            onChange={(id) => {
              const selectedOption = BUSINESS_TIMINGS_OPTIONS.find(
                (option) => option.id === id,
              );
              setForm((f) => ({ ...f, shopTimings: selectedOption }));
            }}
            error={!!errors.shopTimings}
            placeholder="Select timings"
            style={{ marginVertical: 8 }}
          />
          {!!errors.shopTimings && (
            <Text style={styles.errorText}>{errors.shopTimings}</Text>
          )}
          <TextField
            label="Description (Optional)"
            placeholder="Short summary of your business/services"
            value={form.description}
            onChangeText={(text) =>
              setForm((f) => ({ ...f, description: text }))
            }
            multiline
            numberOfLines={3}
            containerStyle={{ marginVertical: 8 }}
          />
          <TextField
            label="Address"
            placeholder="e.g., Shop #4, near the main gate"
            value={form.address}
            onChangeText={(text) => setForm((f) => ({ ...f, address: text }))}
            containerStyle={{ marginVertical: 8 }}
          />
          <TextField
            label="Unit (Optional)"
            placeholder="e.g., piece, kg, session, 12 x 16 inches"
            value={form.unit}
            onChangeText={(text) => setForm((f) => ({ ...f, unit: text }))}
            containerStyle={{ marginVertical: 8 }}
          />
        </>
      )}
      {step === 1 && (
        <>
          <InfoBanner
            title="Upload a thumbnail image for your business. This will be shown in the community directory."
            backgroundColor={t.colors.lightBackground}
            borderColor={t.colors.primary}
            titleColor={t.colors.themeTextColor}
          />
          {hasRole(UserRole.ADMIN) && (
            <View style={styles.radioContainer}>
              <Text style={styles.radioLabel}>Is this business for?*</Text>
              <View style={styles.radioButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    form.businessFor === "self" && styles.radioButtonSelected,
                  ]}
                  onPress={() =>
                    setForm((f) => ({ ...f, businessFor: "self" }))
                  }
                >
                  <View
                    style={[
                      styles.radioCircle,
                      form.businessFor === "self" && styles.radioCircleSelected,
                    ]}
                  >
                    {form.businessFor === "self" && (
                      <View style={styles.radioInnerCircle} />
                    )}
                  </View>
                  <Text style={styles.radioText}>Self</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    form.businessFor === "other" && styles.radioButtonSelected,
                  ]}
                  onPress={() =>
                    setForm((f) => ({ ...f, businessFor: "other" }))
                  }
                >
                  <View
                    style={[
                      styles.radioCircle,
                      form.businessFor === "other" &&
                        styles.radioCircleSelected,
                    ]}
                  >
                    {form.businessFor === "other" && (
                      <View style={styles.radioInnerCircle} />
                    )}
                  </View>
                  <Text style={styles.radioText}>Other</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <TextField
            label="Email (Optional)"
            placeholder="e.g., business@example.com"
            value={form.email}
            onChangeText={(text) => setForm((f) => ({ ...f, email: text }))}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            containerStyle={{ marginVertical: 8 }}
          />
          <TextField
            label="GST Number (Optional)"
            placeholder="e.g., 22AAAAA0000A1Z5"
            value={form.gstNumber}
            onChangeText={(text) =>
              setForm((f) => ({ ...f, gstNumber: text.toUpperCase() }))
            }
            error={errors.gstNumber}
            autoCapitalize="characters"
            maxLength={15}
            containerStyle={{ marginVertical: 8 }}
          />
          <CloudinaryImagePickerField
            label="Business Thumbnail (Optional)"
            value={form.images ?? []}
            onChange={handleChangeImages}
            max={1}
            tileSize={120}
            disabled={loading}
            style={styles.imagePickerContainer}
          />
        </>
      )}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
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
            step === 1
              ? loading || submitting
                ? submitLabel
                  ? `${submitLabel}...`
                  : "Publishing..."
                : (submitLabel ?? "Publish Business")
              : "Continue"
          }
          onPress={handleContinue}
          fullWidth
          containerStyle={styles.continueButton}
          disabled={loading || submitting}
          loading={loading || submitting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 18,
    marginTop: 8,
    color: "#111827",
  },
  errorText: {
    color: "#EF4444",
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 13,
  },
  imagePickerContainer: {
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    elevation: 0,
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
  radioContainer: {
    marginVertical: 16,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  radioButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    gap: 12,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flex: 1,
  },
  radioButtonSelected: {
    borderColor: "#F97316",
    backgroundColor: "#FFF7ED",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: "#F97316",
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F97316",
  },
  radioText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
});
