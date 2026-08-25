import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
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
  ...rest
}: Props) {
  const t = useUiTheme();
  const [focused, setFocused] = useState(false);

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
          style={[t.typography.body, { flex: 1, color: t.colors.textPrimary, paddingVertical: t.spacing.sm }]}
        />
        {rightIcon ? (
          <Ionicons name={rightIcon} size={t.dimensions.iconSm} color={t.colors.textMuted} onPress={onRightIconPress} />
        ) : null}
      </View>
      {error ? (
        <Text style={[t.typography.caption, { color: t.colors.error, marginTop: t.spacing.xs }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[t.typography.caption, { color: t.colors.textMuted, marginTop: t.spacing.xs }]}>{helperText}</Text>
      ) : null}
    </View>
  );
});

export default GlobalInput;
