import { STOCK_OPTIONS } from "@/assets/mocks/category";
import ActionButton from "@/components/inputs/ActionButton";
import { useTheme } from "@/theme/theme";
import { BusinessCatalogue } from "@/types/business.type";
import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DiscountCalculator from "../inputs/DiscountCalculator";
import TextField from "../inputs/TextField";
import InfoBanner from "../UI/InfoBanner";
import CloudinaryImagePickerField from "./CloudinaryImagePickerField";

const defaultForm: BusinessCatalogue = {
  title: "",
  description: "",
  price: 0,
  mrp: undefined,
  images: [],
  unit: "",
  itemType: "",
  inStock: STOCK_OPTIONS[0].id, // default to first option
  tags: [],
};

export default function CatalougeForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<BusinessCatalogue>;
  onSubmit?: (data: BusinessCatalogue) => void;
}) {
  const t = useTheme();
  const [form, setForm] = useState<BusinessCatalogue>({
    ...defaultForm,
    ...initial,
  });
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BusinessCatalogue, string>>
  >({});
  // Discount data from calculator - kept for potential analytics/tracking
  const [discountData, setDiscountData] = useState<{
    discountPercent: string;
    saveAmount: string;
  } | null>(null);

  // Stepper labels
  const stepLabels = useMemo(
    () => ["Product Info", "Images & Media", "Price & Stock"],
    []
  );
  const stockOptions = useMemo(() => STOCK_OPTIONS, []);

  const handleChange = useCallback(
    (key: keyof BusinessCatalogue, value: any) => {
      setForm((prev) => {
        if (prev[key] === value) return prev;
        return { ...prev, [key]: value };
      });
    },
    []
  );

  const handleTagInput = useCallback(
    (text: string) => {
      handleChange(
        "tags",
        text
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      );
    },
    [handleChange]
  );

  const handleDiscountCalculate = useCallback(
    (result: { discountPercent: string; saveAmount: string }) => {
      setDiscountData(result);
    },
    []
  );

  const validateStep0 = useCallback(() => {
    let valid = true;
    const err: Partial<Record<keyof BusinessCatalogue, string>> = {};
    if (!form.title.trim()) {
      err.title = "Product title is required.";
      valid = false;
    }
    if (!(form.description ?? "").trim()) {
      err.description = "Description is required.";
      valid = false;
    } else if ((form.description ?? "").trim().length < 20) {
      err.description = "Description must be at least 20 characters.";
      valid = false;
    }
    setErrors(err);
    return valid;
  }, [form.title, form.description]);

  const validateStep2 = useCallback(() => {
    let valid = true;
    const err: Partial<Record<keyof BusinessCatalogue, string>> = {};
    if (!form.price) {
      err.price = "Price is required.";
      valid = false;
    }
    if (!form.mrp) {
      err.mrp = "MRP is required.";
      valid = false;
    }
    if (form.mrp && form.price && form.mrp <= form.price) {
      err.mrp = "MRP must be greater than Price.";
      valid = false;
    }
    setErrors(err);
    return valid;
  }, [form.price, form.mrp]);

  const handleNext = useCallback(() => {
    if (step === 0 && !validateStep0()) return;
    setStep((s) => Math.min(s + 1, 2));
  }, [step, validateStep0]);

  const handlePrevious = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleSubmit = useCallback(() => {
    setSubmitting(true);
    if (!validateStep2()) {
      setSubmitting(false);
      return;
    }
    // Include discount data for tracking/analytics if available
    const submitData: BusinessCatalogue = {
      ...form,
      // Discount data can be used for analytics tracking
      ...(discountData && {
        discountInfo: {
          discountPercent: discountData.discountPercent,
          saveAmount: discountData.saveAmount,
        },
      }),
    } as BusinessCatalogue;
    onSubmit?.(submitData);
    setSubmitting(false);
  }, [form, onSubmit, validateStep2, discountData]);

  // Compute if Next should be disabled on step 1
  const isNextDisabled = useMemo(() => {
    if (step === 1) {
      return (
        !form.images ||
        !Array.isArray(form.images) ||
        form.images.length === 0 ||
        !form.images[0]
      );
    }
    return false;
  }, [step, form.images]);

  // Memoize stepper
  const stepper = useMemo(
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
    [step, stepLabels]
  );

  const renderStepContent = useCallback(() => {
    switch (step) {
      case 0:
        return (
          <>
            <InfoBanner
              title="Add a new product to your business catalogue."
              backgroundColor={t.colors.lightBackground}
              borderColor={t.colors.primary}
              titleColor={t.colors.themeTextColor}
            />
            <TextField
              label="Product Title*"
              placeholder="e.g., Handmade Soap"
              value={form.title}
              onChangeText={handleChange.bind(null, "title")}
              error={errors.title}
              minLength={1}
              maxLength={30}
              required
              containerStyle={{ marginVertical: 8 }}
            />
            <TextField
              label="Description"
              placeholder="Describe the item or service"
              value={form.description}
              error={errors.description}
              onChangeText={handleChange.bind(null, "description")}
              multiline
              minLength={1}
              maxLength={300}
              numberOfLines={3}
              containerStyle={{ marginVertical: 8 }}
            />
            <TextField
              label="Unit"
              placeholder="e.g. kg, piece"
              value={form.unit}
              onChangeText={handleChange.bind(null, "unit")}
              containerStyle={{ marginVertical: 8 }}
            />
            <TextField
              label="Type"
              placeholder="product, service, etc."
              value={form.itemType}
              onChangeText={handleChange.bind(null, "itemType")}
              containerStyle={{ marginVertical: 8 }}
            />
            <TextField
              label="Tags (comma separated)"
              placeholder="e.g. art, painting, workshop"
              value={form.tags?.join(", ") || ""}
              onChangeText={handleTagInput}
              containerStyle={{ marginVertical: 8 }}
            />
          </>
        );
      case 1:
        return (
          <>
            <InfoBanner
              title="Upload images for your product."
              backgroundColor={t.colors.lightBackground}
              borderColor={t.colors.primary}
              titleColor={t.colors.themeTextColor}
            />
            <CloudinaryImagePickerField
              label="Business Thumbnail"
              value={form.images ?? []}
              onChange={handleChange.bind(null, "images")}
              max={1}
              tileSize={120}
              style={styles.imagePickerContainer}
            />
          </>
        );
      case 2:
        return (
          <>
            <TextField
              label="Price*"
              placeholder="e.g. 499"
              value={form.price ? String(form.price) : ""}
              onChangeText={(text) =>
                handleChange("price", Number(text.replace(/[^0-9.]/g, "")))
              }
              error={errors.price}
              required
              keyboardType="numeric"
              containerStyle={{ marginVertical: 8 }}
            />
            <TextField
              label="MRP"
              placeholder="e.g. 599"
              value={form.mrp ? String(form.mrp) : ""}
              onChangeText={(text) =>
                handleChange("mrp", Number(text.replace(/[^0-9.]/g, "")))
              }
              error={errors.mrp}
              keyboardType="numeric"
              containerStyle={{ marginVertical: 8 }}
            />
            <Text style={styles.label}>Stock Status</Text>
            <View style={styles.optionsGrid}>
              {stockOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.optionRow}
                  onPress={() => handleChange("inStock", opt.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={
                    form.inStock === opt.id
                      ? { checked: true }
                      : { checked: false }
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      form.inStock === opt.id && styles.checkboxChecked,
                    ]}
                  />
                  <Text style={styles.optionLabel}>{opt.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <DiscountCalculator
              mrp={form.mrp ?? ""}
              sellingPrice={form.price}
              quantityUnit={form.unit || "unit"}
              onCalculate={handleDiscountCalculate}
            />
          </>
        );
      default:
        return null;
    }
  }, [
    step,
    t.colors,
    form,
    errors,
    handleChange,
    handleTagInput,
    stockOptions,
    handleDiscountCalculate,
  ]);

  return (
    <ScrollView
      contentContainerStyle={[styles.container]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Stepper Header */}
      {stepper}

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {step > 0 && (
          <ActionButton
            title="Previous"
            onPress={handlePrevious}
            variant="outline"
            fullWidth
            containerStyle={styles.backButton}
          />
        )}
        <ActionButton
          title={step === 2 ? (submitting ? "Saving..." : "Save Item") : "Next"}
          onPress={step === 2 ? handleSubmit : handleNext}
          fullWidth
          disabled={(submitting && step === 2) || isNextDisabled}
          containerStyle={styles.continueButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 18,
    marginTop: 8,
    color: "#111827",
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#111827",
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
  // BusinessForm stepper styles
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
  buttonContainer: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#111827",
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
    color: "#22223B",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    marginVertical: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginRight: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  optionLabel: {
    color: "#111827",
    fontSize: 15,
  },
  errorText: {
    color: "#EF4444",
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 13,
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
  continueButton: {
    flex: 1,
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
});
