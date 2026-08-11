import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

type Props = TextInputProps & {
  label: string;
  optionalLabel?: boolean;
  helperText?: string;
  error?: string | null;
  leftIcon?: keyof typeof Ionicons.glyphMap;
};

/**
 * Terrace-styled text field: label above the field, icon-in-row input with
 * a rounded outline border. Cloned from components/inputs/TextField.tsx and
 * restyled to match the onboarding/verification screens — kept separate so
 * the original notched-label TextField (used elsewhere) is untouched.
 */
function TerraceTextField({
  label,
  optionalLabel,
  helperText,
  error,
  leftIcon,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {optionalLabel ? <Text style={styles.optional}> (Optional)</Text> : null}
      </Text>

      <View
        style={[
          styles.inputRow,
          focused && { borderColor: TERRACE_COLORS.orange },
          !!error && { borderColor: "#DC2626" },
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={getWidth(18)}
            color={TERRACE_COLORS.textMuted}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          {...inputProps}
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

export default memo(TerraceTextField);

const styles = StyleSheet.create({
  container: {
    marginBottom: getHeight(18),
  },
  label: {
    fontSize: getWidth(14),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
    marginBottom: getHeight(8),
  },
  optional: {
    fontWeight: "400",
    color: TERRACE_COLORS.textMuted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TERRACE_COLORS.screenBg,
    borderRadius: getWidth(14),
    borderWidth: 1.5,
    borderColor: TERRACE_COLORS.inputBorder,
    height: getHeight(54),
    paddingHorizontal: getWidth(14),
  },
  icon: {
    marginRight: getWidth(10),
  },
  input: {
    flex: 1,
    fontSize: getWidth(16),
    color: TERRACE_COLORS.textDark,
    height: "100%",
  },
  helperText: {
    fontSize: getWidth(12.5),
    color: TERRACE_COLORS.textMuted,
    marginTop: getHeight(6),
  },
  errorText: {
    fontSize: getWidth(12.5),
    color: "#DC2626",
    marginTop: getHeight(6),
  },
});
