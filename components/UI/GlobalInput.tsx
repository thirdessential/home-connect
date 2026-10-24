import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { textAreaHeights } from "@/lib/createEventForm";
import GlobalLabel from "./GlobalLabel";
import { useUiTheme } from "./useUiTheme";

type Props = Omit<TextInputProps, "style"> & {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  /**
   * Opt-in real text area for `multiline` fields: a fixed `numberOfLines`-tall box (default 4) that
   * keeps the text top-aligned and scrolls inside itself once it grows past ~2x that height. Without
   * it a multiline field is only as tall as its text, which reads as a one-line input.
   */
  textArea?: boolean;
};

const GlobalInput = memo(function GlobalInput({
  label,
  required,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
  editable = true,
  multiline,
  textArea,
  ...rest
}: Props) {
  const t = useUiTheme();
  const [focused, setFocused] = useState(false);

  const areaHeights =
    multiline && textArea
      ? textAreaHeights(rest.numberOfLines ?? 4, t.typography.body.lineHeight, t.spacing.sm)
      : null;

  const borderColor = error ? t.colors.error : focused ? t.colors.primary : t.colors.border;

  return (
    <View style={{ marginBottom: t.spacing.lg }}>
      {label ? <GlobalLabel required={required}>{label}</GlobalLabel> : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          minHeight: t.dimensions.inputHeight,
          borderWidth: 1.5,
          borderColor,
          borderRadius: t.radius.md,
          backgroundColor: editable ? t.colors.surface : t.colors.divider,
          paddingHorizontal: t.spacing.md,
          paddingVertical: multiline ? t.spacing.sm : 0,
        }}
      >
        {leftIcon ? <Ionicons name={leftIcon} size={t.dimensions.iconSm} color={t.colors.textMuted} style={{ marginRight: t.spacing.sm }} /> : null}
        <TextInput
          {...rest}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={t.colors.textMuted}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...(areaHeights ? { scrollEnabled: true, textAlignVertical: "top" as const } : null)}
          style={[
            t.typography.body,
            { flex: 1, color: t.colors.textPrimary, paddingVertical: t.spacing.sm },
            areaHeights ? { minHeight: areaHeights.minHeight, maxHeight: areaHeights.maxHeight } : null,
          ]}
        />
        {rightIcon ? (
          <Ionicons name={rightIcon} size={t.dimensions.iconSm} color={t.colors.textMuted} onPress={onRightIconPress} />
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[t.typography.caption, { color: t.colors.error, marginTop: t.spacing.xs }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[t.typography.caption, { color: t.colors.textMuted, marginTop: t.spacing.xs }]}>{helperText}</Text>
      ) : null}
    </View>
  );
});

export default GlobalInput;
