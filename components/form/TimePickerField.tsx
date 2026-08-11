import { useTheme } from "@/theme/theme";
import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface TimePickerFieldProps {
  label: string;
  value: string; // Time string (HH:MM format)
  onChange: (time: string) => void;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  show?: boolean;
  setShow?: (show: boolean) => void;
}

export const TimePickerField: React.FC<TimePickerFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helpText,
  disabled,
  show,
  setShow,
}) => {
  const theme = useTheme();
  const [internalShow, internalSetShow] = useState(false);

  const pickerSetShow = useMemo(() => setShow ?? internalSetShow, [setShow]);
  const pickerShow = typeof show === "boolean" ? show : internalShow;

  // Parse "HH:MM" → fresh Date object each time so iOS spinner
  // always opens at the correct position (avoid in-place mutation bug)
  const dateObj = useMemo(() => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    if (value) {
      const parts = value.split(":");
      const parsedH = parseInt(parts[0], 10);
      const parsedM = parseInt(parts[1], 10);
      if (!isNaN(parsedH)) hours = parsedH;
      if (!isNaN(parsedM)) minutes = parsedM;
    }

    // Build a clean Date — do NOT mutate, always construct fresh
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0,
    );
  }, [value]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    pickerSetShow(true);
  }, [disabled, pickerSetShow]);

  const handleConfirm = useCallback(
    (date: Date) => {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      onChange(`${hours}:${minutes}`);
      pickerSetShow(false);
    },
    [onChange, pickerSetShow],
  );

  const handleCancel = useCallback(() => pickerSetShow(false), [pickerSetShow]);

  const triggerStyle = useMemo(
    () => [
      styles.trigger,
      {
        borderColor: error ? theme.colors.error : theme.colors.border,
        backgroundColor: disabled
          ? theme.colors.surfaceAlt
          : theme.colors.surface,
      },
    ],
    [
      error,
      disabled,
      theme.colors.error,
      theme.colors.border,
      theme.colors.surfaceAlt,
      theme.colors.surface,
    ],
  );

  const displayText = value ? `${value} ⏰` : "Select time";

  // On iOS: "spinner" is the native wheel — do NOT pass textColor or
  // themeVariant alongside it, they conflict and freeze the display.
  // On Android: "default" gives the native clock dialog which is most reliable.
  const pickerDisplay = Platform.OS === "ios" ? "spinner" : "default";

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
        {label}
      </Text>

      <TouchableOpacity
        onPress={handleOpen}
        style={triggerStyle}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
      >
        <Text
          style={{
            color: value
              ? theme.colors.textPrimary
              : theme.colors.textSecondary,
          }}
        >
          {displayText}
        </Text>
      </TouchableOpacity>

      {helpText ? (
        <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
          {helpText}
        </Text>
      ) : null}

      {error ? (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}

      <DateTimePickerModal
        isVisible={pickerShow}
        mode="time"
        date={dateObj}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        // ✅ display is platform-specific — avoids the iOS freeze bug
        display={pickerDisplay}
        // ✅ accentColor only on iOS, safe to pass
        accentColor={theme.colors.primary}
        // ✅ Remove textColor + themeVariant — these conflict with
        //    display="spinner" on iOS and cause the time to stick at 5:30
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontWeight: "700",
    marginBottom: 4,
  },
  trigger: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  helpText: {
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 2,
  },
});
