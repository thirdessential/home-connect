import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import { getHeight, getWidth, useTheme } from "@/theme/theme";
import { useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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

  // Index being edited when the user taps an already-filled box (null = append).
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const focus = (index?: number) => {
    setEditIndex(index !== undefined && index < value.length ? index : null);
    const input = inputRef.current;
    if (!input) return;
    // Focused but keyboard dismissed: focus() alone is a no-op, so re-focus.
    if (input.isFocused() && !Keyboard.isVisible()) input.blur();
    requestAnimationFrame(() => input.focus());
  };
  const activeIndex =
    editIndex ?? (value.length >= length ? length - 1 : value.length);

  const handleChange = (raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, length);
    if (editIndex === null) return onChange(clean);
    if (clean.length > value.length && clean.length - value.length === 1) {
      // Replace the tapped digit, then move to the next box.
      const next = value.slice(0, editIndex) + clean.slice(-1) + value.slice(editIndex + 1);
      setEditIndex(editIndex + 1 < value.length ? editIndex + 1 : null);
      return onChange(next);
    }
    if (clean.length < value.length) {
      // Backspace: clear the tapped digit.
      return onChange(value.slice(0, editIndex) + value.slice(editIndex + 1));
    }
    setEditIndex(null);
    onChange(clean); // paste / autofill
  };

  return (
    <Pressable onPress={() => focus()} style={styles.row}>
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
          <Pressable
            key={i}
            onPress={() => focus(i)}
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
          </Pressable>
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
    alignItems: "center",
    gap: getWidth(10),
  },
  cell: {
    flex: 1,
    height: getHeight(54),
    borderRadius: getWidth(12),
    alignItems: "center",
    justifyContent: "center",
  },
  char: {
    fontSize: getWidth(24),
    fontFamily: "Manrope_600SemiBold",
    color: TERRACE_COLORS.textDark,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
