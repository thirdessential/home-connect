import { TextAreaProps } from "@/types/form.type";
import React, { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/theme";

export default function TextArea({
  label = "",
  value,
  onChangeText,
  lines = 3,
  placeholder = "Type here…",
  maxLength,
  disabled,
  error,
  helpText,
  containerStyle,
  inputProps,
}: TextAreaProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  const lh = 20; // lineHeight px used to size box
  const minHeight = useMemo(
    () => Math.max(44, lh * lines + t.spacing.s * 2 + 6),
    [lines, lh, t.spacing.s]
  );

  const borderColor = error
    ? t.colors.error
    : focused
      ? t.colors.primary
      : t.colors.border;

  const labelColor = error
    ? t.colors.error
    : focused
      ? t.colors.primary
      : t.colors.textSecondary;

  return (
    <View style={[{ width: "100%" }, containerStyle]}>
      {/* floating label (only shown if label is provided) */}
      {label ? (
        <View
          style={{
            position: "absolute",
            left: t.spacing.m - 4,
            top: -8,
            zIndex: 2,
            backgroundColor: t.colors.surface,
            paddingHorizontal: 6,
            borderRadius: 6,
          }}
          pointerEvents="none"
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: labelColor }}>
            {label}
          </Text>
        </View>
      ) : null}

      {/* textarea */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.textSecondary}
        editable={!disabled}
        multiline
        numberOfLines={lines}
        textAlignVertical="top"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={maxLength}
        className="rounded-xl px-3 py-2"
        style={{
          minHeight,
          borderWidth: 1,
          borderColor,
          backgroundColor: t.colors.surface,
          color: t.colors.textPrimary,
          lineHeight: lh,
        }}
        {...inputProps}
      />

      {/* help / error / counter */}
      <View style={{ flexDirection: "row", marginTop: 6 }}>
        {!!(error || helpText) && (
          <Text
            style={{
              flex: 1,
              color: error ? t.colors.error : t.colors.textSecondary,
              fontSize: 12,
              paddingHorizontal: 5,
            }}
            numberOfLines={2}
          >
            {error || helpText}
          </Text>
        )}
        {typeof maxLength === "number" && (
          <Text style={{ color: t.colors.textSecondary, fontSize: 12 }}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}
