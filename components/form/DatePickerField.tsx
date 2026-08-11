import { useTheme } from "@/theme/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import {
  Modal,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface DatePickerFieldProps {
  label: string;
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  show?: boolean;
  setShow?: (show: boolean) => void;
  modalBackdropStyle?: StyleProp<ViewStyle>;
  modalContentStyle?: StyleProp<ViewStyle>;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  error,
  helpText,
  disabled,
  show,
  setShow,
  modalBackdropStyle,
  modalContentStyle,
}) => {
  const theme = useTheme();
  const dateObj = value ? new Date(value) : new Date();

  // Use parent state if provided, else fallback to internal state
  const [internalShow, internalSetShow] = React.useState(false);
  const pickerShow = typeof show === "boolean" ? show : internalShow;
  const pickerSetShow = setShow || internalSetShow;

  const onChangeDate = (_: any, selectedDate?: Date) => {
    pickerSetShow(false);
    if (selectedDate) {
      // Format as YYYY-MM-DD
      const iso = selectedDate.toISOString().slice(0, 10);
      onChange(iso);
    }
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontWeight: "700",
          marginBottom: 4,
          color: theme.colors.textPrimary,
        }}
      >
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => !disabled && pickerSetShow(true)}
        style={{
          padding: 12,
          borderWidth: 1,
          borderColor: error ? theme.colors.error : theme.colors.border,
          borderRadius: theme.radii.s,
          backgroundColor: disabled
            ? theme.colors.surfaceAlt
            : theme.colors.surface,
        }}
        disabled={disabled}
      >
        <Text
          style={{
            color: value
              ? theme.colors.textPrimary
              : theme.colors.textSecondary,
          }}
        >
          {value || "Select date"}
        </Text>
      </TouchableOpacity>
      {helpText && (
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {helpText}
        </Text>
      )}
      {error && (
        <Text style={{ color: theme.colors.error, fontSize: 12, marginTop: 2 }}>
          {error}
        </Text>
      )}
      {pickerShow && Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="fade"
          visible={pickerShow}
          onRequestClose={() => pickerSetShow(false)}
        >
          <View style={styles.backdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => pickerSetShow(false)}
              activeOpacity={1}
            />
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.colors.surface },
                modalContentStyle,
              ]}
            >
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="spinner"
                onChange={onChangeDate}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                textColor={theme.colors.textPrimary}
                accentColor={theme.colors.primary}
                style={styles.picker}
              />
              <TouchableOpacity
                onPress={() => pickerSetShow(false)}
                style={styles.doneButton}
              >
                <Text
                  style={[styles.doneText, { color: theme.colors.primary }]}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {pickerShow && Platform.OS !== "ios" && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display="default"
          onChange={onChangeDate}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={theme.colors.primary}
          themeVariant="light"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
  },
  picker: {
    width: "100%",
  },
  doneButton: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
