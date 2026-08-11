import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DatePickerField } from "../form/DatePickerField";
import SelectField from "../form/dropdown";
import ActionButton from "../inputs/ActionButton";
import DiscountCalculator from "../inputs/DiscountCalculator";
import TextField from "../inputs/TextField";

import { DEAL_STATUS, verificationStatus } from "@/assets/enums/common.enum";
import {
  DEALS_OPTIONS,
  UNIT_OPTIONS,
  WHOLESALE_DEALS_CAT,
} from "@/assets/mocks/category";
import { useTheme } from "@/theme/theme";
import type { DealOptions, ProductPrice } from "@/types/business.type";
import { WholesaleDeal } from "@/types/business.type";
import InfoBanner from "../UI/InfoBanner";
import CloudinaryImagePickerField from "./CloudinaryImagePickerField";
import { Ionicons } from "@expo/vector-icons";

type WholesaleDealFormErrors = Partial<
  Record<keyof Partial<WholesaleDeal> | "mrp" | "dealPrice", string>
>;

interface WholesaleDealFormProps {
  onSubmit?: (data: Partial<WholesaleDeal>) => void;
  loading?: boolean;
  error?: string | null;
  onBack?: () => void;
  initialData?: Partial<WholesaleDeal>;
  submitLabel?: string;
  isEdit?: boolean;
}

export default function WholesaleDealForm({
  onSubmit,
  loading = false,
  error,
  onBack,
  initialData,
  submitLabel,
  isEdit = false,
}: WholesaleDealFormProps) {
  const t = useTheme();
  const [step, setStep] = useState<number>(0);
  const defaultPrice: ProductPrice = {
    mrp: "",
    discountPrcnt: "",
    sellingPrice: "",
    saveAmount: "",
  };
  const [form, setForm] = useState<Partial<WholesaleDeal>>(() => ({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? "",
    quantityUnit: initialData?.quantityUnit ?? "",
    price: initialData?.price ?? defaultPrice,
    minimumOrderQty: initialData?.minimumOrderQty ?? undefined,
    maximumOrderQty: initialData?.maximumOrderQty ?? undefined,
    orderDeadlineDate: initialData?.orderDeadlineDate ?? "",
    estimatedDeliveryDate: initialData?.estimatedDeliveryDate ?? "",
    dealOptions: initialData?.dealOptions ?? {},
  }));
  const [selectedOptions, setSelectedOptions] = useState<string[]>([
    "cashOnDelivery",
  ]);
  const [errors, setErrors] = useState<WholesaleDealFormErrors>({});
  const [discountData, setDiscountData] = useState<{
    discountPercent: string;
    saveAmount: string;
  } | null>(null);

  // Step 1 validation
  const validateStep1 = useCallback(() => {
    let valid = true;
    const err: WholesaleDealFormErrors = {};
    if ((form.title ?? "").trim().length < 5) {
      err.title = "Item title must be at least 5 characters.";
      valid = false;
    }
    if (!(form.category ?? "").trim()) {
      err.category = "Category is required.";
      valid = false;
    }
    if (
      !(form.description ?? "").trim() ||
      (form.description ?? "").trim().length < 20
    ) {
      err.description = "Description must be at least 20 characters.";
      valid = false;
    }
    if (!(form.price?.mrp ?? "").trim()) {
      err.mrp = "Market Price is required.";
      valid = false;
    }
    if (!(form.price?.sellingPrice ?? "").trim()) {
      err.dealPrice = "Your Deal Price is required.";
      valid = false;
    }
    if (
      form.price?.sellingPrice &&
      form.price?.mrp &&
      parseFloat(form.price.sellingPrice) >= parseFloat(form.price.mrp)
    ) {
      err.dealPrice = "Your Deal Price must be less than Market Price.";
      valid = false;
    }
    if (!form.quantityUnit) {
      err.quantityUnit = "Quantity Unit is required.";
      valid = false;
    }
    setErrors(err);
    return valid;
  }, [form]);

  // Step 2 validation
  const validateStep2 = useCallback(() => {
    let valid = true;
    const err: WholesaleDealFormErrors = {};
    if (form.minimumOrderQty == null) {
      err.minimumOrderQty = "Minimum goal is required.";
      valid = false;
    } else if (form.minimumOrderQty < 1 || form.minimumOrderQty > 20) {
      err.minimumOrderQty = "Minimum goal must be between 1 and 20.";
      valid = false;
    }
    if (form.maximumOrderQty == null) {
      err.maximumOrderQty = "Maximum orders is required.";
      valid = false;
    } else if (form.maximumOrderQty > 50) {
      err.maximumOrderQty = "Maximum orders cannot exceed 50.";
      valid = false;
    } else if (
      form.minimumOrderQty != null &&
      form.maximumOrderQty <= form.minimumOrderQty
    ) {
      err.maximumOrderQty = "Maximum orders must be greater than minimum goal.";
      valid = false;
    }
    if (!(form.orderDeadlineDate ?? "").trim()) {
      err.orderDeadlineDate = "Order deadline is required.";
      valid = false;
    }
    if (!(form.estimatedDeliveryDate ?? "").trim()) {
      err.estimatedDeliveryDate = "Delivery date is required.";
      valid = false;
    }
    // Ensure delivery is 1–15 days after deadline if both provided
    if (form.orderDeadlineDate && form.estimatedDeliveryDate) {
      const dl = new Date(form.orderDeadlineDate);
      const ed = new Date(form.estimatedDeliveryDate);
      const minDelivery = new Date(dl);
      minDelivery.setDate(dl.getDate() + 1);
      const maxDelivery = new Date(dl);
      maxDelivery.setDate(dl.getDate() + 15);
      if (ed < minDelivery) {
        err.estimatedDeliveryDate =
          "Delivery must be at least 1 day after the order deadline.";
        valid = false;
      } else if (ed > maxDelivery) {
        err.estimatedDeliveryDate =
          "Delivery must be within 15 days of the order deadline.";
        valid = false;
      }
    }
    setErrors(err);
    return valid;
  }, [form]);

  // Step 3 validation (no required fields)
  const handleContinue = useCallback(() => {
    if (step === 0 && validateStep1()) setStep(1);
    else if (step === 1 && validateStep2()) setStep(2);
    else if (step === 2) {
      const idMap: Record<string, keyof DealOptions> = {
        testBeforeAccept: "openBoxDelivery",
        cashOnDelivery: "cashOnDelivery",
        moneyBackGuarantee: "moneyBackGuarantee",
        freeSamples: "freeSamples",
      };
      const mapped: DealOptions = {};
      selectedOptions.forEach((id) => {
        const key = idMap[id];
        if (key) (mapped as any)[key] = true;
      });

      const discount = discountData || {
        discountPercent: "0",
        saveAmount: "0",
      };

      const finalForm: Partial<WholesaleDeal> = {
        ...form,
        dealOptions: mapped,
        images: form.images ?? [],
        verificationStatus: {
          status: verificationStatus.PENDING,
          rejectionReason: null,
        },
        price: {
          mrp: form.price?.mrp ?? "",
          sellingPrice: form.price?.sellingPrice ?? "",
          discountPrcnt: discount.discountPercent,
          saveAmount: discount.saveAmount,
        },
        isDealActive: true,
        dealStatus: DEAL_STATUS.ACTIVE,
        currentOrderedQty: 0,
      };
      onSubmit && onSubmit(finalForm);
    }
  }, [
    step,
    validateStep1,
    validateStep2,
    selectedOptions,
    form,
    onSubmit,
    discountData,
  ]);

  const handleBack = useCallback(() => {
    if (step === 0 && onBack) onBack();
    else setStep((s) => s - 1);
  }, [step, onBack]);

  const handleOptionToggle = useCallback((value: string) => {
    if (value === "cashOnDelivery") return;
    setSelectedOptions((opts) =>
      opts.includes(value) ? opts.filter((v) => v !== value) : [...opts, value],
    );
  }, []);

  const handleChangeImages = useCallback((images: string[]) => {
    setForm((prev) => ({ ...prev, images }));
  }, []);

  const handleDiscountCalculate = useCallback(
    (result: { discountPercent: string; saveAmount: string }) => {
      setDiscountData(result);
    },
    [],
  );

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
    >
      {/* <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={{ marginRight: 8 }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={t.colors.textSecondary}
            />
          </TouchableOpacity>
        <Text
          style={[
            styles.headerText,
            { color: t.colors.textPrimary },
          ]}
        >
          {"Create a Wholesale Deal"}
        </Text>
        <TouchableOpacity 
        >
          <Ionicons
            name="close"
            size={24}
            color={t.colors.textSecondary}
          />
        </TouchableOpacity>
      </View> */}
      <View style={styles.stepperRow}>
        {["The Deal", "Logistics", "Options & Image"].map((label, i) => (
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
            {i < 2 && <View style={styles.stepLine} />}
          </View>
        ))}
      </View>
      {step === 0 && (
        <>
          <InfoBanner
            title="Start by describing your item and the great price you can offer the community."
            backgroundColor={t.colors.lightBackground}
            borderColor={t.colors.primary}
            titleColor={t.colors.themeTextColor}
          />
          <SelectField
            label="Category*"
            options={WHOLESALE_DEALS_CAT}
            selectedId={form.category ?? null}
            onChange={(id) => setForm((f) => ({ ...f, category: id }))}
            error={!!errors.category}
            placeholder="Select category"
            style={{ marginVertical: 8 }}
          />
          <TextField
            label="Item Title*"
            placeholder="e.g., Organic Alphonso Mangoes"
            value={form.title}
            onChangeText={(text) => setForm((f) => ({ ...f, title: text }))}
            error={errors.title}
            minLength={5}
            maxLength={30}
            required
            containerStyle={{ marginVertical: 8 }}
          />
          <TextField
            label="Description (min 20 chars)*"
            placeholder="Describe the item, its quality, origin, etc."
            value={form.description}
            onChangeText={(text) =>
              setForm((f) => ({ ...f, description: text }))
            }
            error={errors.description}
            minLength={20}
            maxLength={2000}
            required
            multiline
            numberOfLines={4}
            containerStyle={{ marginVertical: 8 }}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Market Price (MRP)*"
                placeholder="e.g., 350"
                value={form.price?.mrp ?? ""}
                onChangeText={(text) =>
                  setForm((f) => ({
                    ...f,
                    price: {
                      ...(f.price ?? {
                        mrp: "",
                        discountPrcnt: "",
                        sellingPrice: "",
                        saveAmount: "",
                      }),
                      mrp: text,
                    },
                  }))
                }
                editable={!isEdit}
                error={errors.mrp}
                required
                keyboardType="numeric"
                containerStyle={{ marginVertical: 8 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Your Deal Price*"
                placeholder="e.g., 250"
                value={form.price?.sellingPrice ?? ""}
                onChangeText={(text) =>
                  setForm((f) => ({
                    ...f,
                    price: {
                      ...(f.price ?? {
                        mrp: "",
                        discountPrcnt: "",
                        sellingPrice: "",
                        saveAmount: "",
                      }),
                      sellingPrice: text,
                    },
                  }))
                }
                editable={!isEdit}
                error={errors.dealPrice}
                required
                keyboardType="numeric"
                containerStyle={{ marginVertical: 8 }}
              />
            </View>
          </View>
          <SelectField
            label="Unit*"
            options={UNIT_OPTIONS}
            selectedId={form.quantityUnit ?? null}
            onChange={(id) => setForm((f) => ({ ...f, quantityUnit: id }))}
            error={!!errors.quantityUnit}
            placeholder="Select unit"
            style={{ marginVertical: 8 }}
          />

          <DiscountCalculator
            mrp={form.price?.mrp ?? ""}
            sellingPrice={form.price?.sellingPrice ?? ""}
            quantityUnit={form.quantityUnit ?? "unit"}
            onCalculate={handleDiscountCalculate}
          />
        </>
      )}
      {step === 1 && (
        <>
          <InfoBanner
            title="Define the rules for the deal to succeed and when it will happen."
            backgroundColor={t.colors.lightBackground}
            borderColor={t.colors.primary}
            titleColor={t.colors.themeTextColor}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Minimum Goal (Max 20)*"
                placeholder="e.g., 20"
                value={String(form.minimumOrderQty ?? "")}
                onChangeText={(text) =>
                  setForm((f) => ({
                    ...f,
                    scrollContainer: {
                      flexGrow: 1,
                      justifyContent: "center",
                    },
                    minimumOrderQty: text ? parseInt(text, 10) : undefined,
                  }))
                }
                editable={!isEdit}
                minLength={1}
                maxLength={20}
                error={errors.minimumOrderQty as string}
                required
                keyboardType="numeric"
                containerStyle={{ marginVertical: 8 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Maximum Orders*"
                placeholder="e.g., 50"
                value={String(form.maximumOrderQty ?? "")}
                onChangeText={(text) =>
                  setForm((f) => ({
                    ...f,
                    maximumOrderQty: text ? parseInt(text, 10) : undefined,
                  }))
                }
                editable={!isEdit}
                minLength={20}
                maxLength={50}
                error={errors.maximumOrderQty as string}
                required
                keyboardType="numeric"
                containerStyle={{ marginVertical: 8 }}
              />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <DatePickerField
                label="Order Deadline*"
                value={form.orderDeadlineDate ?? ""}
                onChange={(date) =>
                  setForm((f) => ({ ...f, orderDeadlineDate: date }))
                }
                disabled={isEdit}
                minimumDate={new Date()}
                maximumDate={
                  new Date(new Date().setMonth(new Date().getMonth() + 2))
                }
                error={errors.orderDeadlineDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <DatePickerField
                label="Est. Delivery Date*"
                value={form.estimatedDeliveryDate ?? ""}
                onChange={(date) =>
                  setForm((f) => ({ ...f, estimatedDeliveryDate: date }))
                }
                minimumDate={
                  form.orderDeadlineDate
                    ? (() => {
                        const d = new Date(form.orderDeadlineDate);
                        d.setDate(d.getDate() + 1);
                        return d;
                      })()
                    : new Date()
                }
                maximumDate={
                  form.orderDeadlineDate
                    ? (() => {
                        const d = new Date(form.orderDeadlineDate);
                        d.setDate(d.getDate() + 15);
                        return d;
                      })()
                    : undefined
                }
                disabled={isEdit || !form.orderDeadlineDate}
                error={errors.estimatedDeliveryDate}
                helpText={
                  form.orderDeadlineDate
                    ? "1–15 days after the deadline"
                    : "Select an order deadline first"
                }
              />
            </View>
          </View>
        </>
      )}
      {step === 2 && (
        <>
          <InfoBanner
            title="Add final options to build trust with your neighbors. These cannot be changed later."
            backgroundColor={t.colors.lightBackground}
            borderColor={t.colors.primary}
            titleColor={t.colors.themeTextColor}
          />
          <View style={styles.optionsGrid}>
            {DEALS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionRow,
                  (isEdit || opt.id === "cashOnDelivery") && { opacity: 0.6 },
                ]}
                disabled={isEdit || opt.id === "cashOnDelivery"}
                onPress={() => handleOptionToggle(opt.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedOptions.includes(opt.id) && styles.checkboxChecked,
                  ]}
                />
                <Text style={styles.optionLabel}>{opt.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <CloudinaryImagePickerField
            label="Deal Image*"
            value={form.images ?? []}
            onChange={handleChangeImages}
            max={1}
            tileSize={120}
            disabled={loading}
            style={styles.imagePickerContainer}
          />
          {!!errors.images && (
            <Text style={styles.errorText}>{errors.images}</Text>
          )}
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
            step === 2
              ? loading
                ? submitLabel
                  ? `${submitLabel}...`
                  : "Publishing..."
                : (submitLabel ?? "Publish Deal")
              : "Continue"
          }
          onPress={handleContinue}
          fullWidth
          containerStyle={styles.continueButton}
          disabled={loading}
          loading={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  stepperItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  activeCircle: {
    borderColor: "#F97316",
    backgroundColor: "#F97316",
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
  circleText: {
    color: "#6B7280",
    fontWeight: "bold",
    fontSize: 15,
  },
  activeCircleText: {
    color: "#fff",
  },
  stepLabel: {
    marginLeft: 8,
    color: "#6B7280",
    fontWeight: "600",
  },
  activeStepLabel: {
    color: "#F97316",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    color: "#111827",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#EF4444",
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 13,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
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
