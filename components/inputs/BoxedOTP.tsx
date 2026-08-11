import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import { getHeight, getWidth, useTheme } from "@/theme/theme";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  error?: boolean;
};

/**
 * Boxed OTP entry: `length` rounded cells backed by a single hidden input.
 * The next empty cell is highlighted while focused (auto-advance UX).
 */
export default function BoxedOTP({
  value,
  onChange,
  length = 6,
  autoFocus = false,
  error = false,
}: Props) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const focus = () => inputRef.current?.focus();
  const activeIndex = value.length >= length ? length - 1 : value.length;

  const handleChange = (raw: string) => {
    onChange(raw.replace(/\D/g, "").slice(0, length));
  };

  return (
    <Pressable onPress={focus} style={styles.row}>
      {Array.from({ length }).map((_, i) => {
        const char = value[i] ?? "";
        const isFilled = char !== "";
        const isActive = focused && i === activeIndex;

        const borderColor = error
          ? theme.colors.error
          : isActive
            ? TERRACE_COLORS.orange
            : isFilled
              ? '#3d3d3dc1'
              : TERRACE_COLORS.inputBorder;

        return (
          <View
            key={i}
            style={[
              styles.cell,
              {
                borderColor,
                borderWidth: isActive || error ? 2 : 1.2,
                backgroundColor: isActive ? "#fff" : "#FFFFFF",
              },
            ]}
          >
            <Text style={styles.char}>{char}</Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cell: {
    width: getWidth(48),
    height: getHeight(58),
    borderRadius: getWidth(12),
    alignItems: "center",
    justifyContent: "center",
  },
  char: {
    fontSize: getWidth(24),
    fontWeight: "600",
    color: TERRACE_COLORS.textDark,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
