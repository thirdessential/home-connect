import { FORM_CONSTANTS } from "@/assets/constants/form.constant";
import { verificationStatus } from "@/assets/enums/common.enum";
import { DAILYHELP_CAT_MOCK } from "@/assets/mocks/category";
import ImagePickerField from "@/components/form/ImagePickerField";
import ActionButton from "@/components/inputs/ActionButton";
import TextField from "@/components/inputs/TextField";
import { validateForm } from "@/lib/validations";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useTheme } from "@/theme/theme";
import { RegisterHelperModalProps } from "@/types/common.type";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import SelectField from "../form/dropdown";

export default function RegisterHelperModal({
  visible,
  onClose,
}: RegisterHelperModalProps) {
  const t = useTheme();
  const { createDailyHelper } = useDailyHelperStore();
  const { selectedSociety } = useSocietyStore();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    description: "",
    category: "",
    images: [],
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const handleInputChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!validateFormFields()) return;
    const updatedDailyService = {
      ...form,
      phone: `+91${form.phone}`,
      societyIds: [selectedSociety?._id || ""],
      verificationStatus: {
        status: verificationStatus.PENDING,
        rejectionReason: null,
      },
    };
    await createDailyHelper(updatedDailyService);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      description: "",
      category: "",
      images: [],
    });
    setErrors({});
  };

  const validateFormFields = () => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            maxHeight: "80%",
            backgroundColor: t.colors.surface,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: t.colors.textPrimary,
              }}
            >
              {FORM_CONSTANTS.ADD_HELPER}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={t.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 14,
              marginBottom: 20,
              color: t.colors.textSecondary,
            }}
          >
            {FORM_CONSTANTS.ADD_HELPER_NEARBY}{" "}
            <Text style={{ fontWeight: "bold" }}>{selectedSociety?.name}</Text>
          </Text>

          <ScrollView style={{ width: "100%", paddingTop: 10 }}>
            <TextField
              label={FORM_CONSTANTS.NAME}
              placeholder={FORM_CONSTANTS.ENTER_FULL_NAME}
              value={form.name}
              onChangeText={(value) => handleInputChange("name", value)}
              required
              containerStyle={{ marginBottom: 12 }}
              error={errors.name}
            />

            <TextField
              label={FORM_CONSTANTS.PHONE}
              placeholder={FORM_CONSTANTS.ENTER_PHONE_NUMBER}
              value={form.phone}
              onChangeText={(value) => handleInputChange("phone", value)}
              keyboardType="phone-pad"
              required
              maxLength={10}
              containerStyle={{ marginBottom: 12 }}
              error={errors.phone}
            />

            <SelectField
              label={FORM_CONSTANTS.CATEGORY}
              options={DAILYHELP_CAT_MOCK}
              selectedId={form.category}
              onChange={(id) => handleInputChange("category", id)}
              placeholder="Choose a category"
              modalTitle="Choose category"
              style={{ marginBottom: 12 }}
            />

            <TextField
              label={FORM_CONSTANTS.DESCRIPTION}
              placeholder={FORM_CONSTANTS.DESCRIPTION_PLACEHOLDER}
              value={form.description}
              onChangeText={(value) => handleInputChange("description", value)}
              multiline
              numberOfLines={3}
              containerStyle={{ marginBottom: 12 }}
            />

            <ImagePickerField
              label="Upload images"
              value={form.images || []}
              onChange={(images) => handleInputChange("images", images)}
              style={{ marginBottom: 12 }}
            />

            <ActionButton
              title={FORM_CONSTANTS.REGISTER}
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              containerStyle={{ marginTop: 20, marginBottom: 10 }}
              disabled={!form.name || !form.phone || !form.category}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
