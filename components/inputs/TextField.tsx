import { TextFieldHandle, TextFieldProps } from "@/types/input.types";
import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../theme/theme";

const TextField = forwardRef<TextFieldHandle, TextFieldProps>(
  (
    {
      label,
      hint,
      error,
      required,
      disabled = false,
      leftIconName,
      rightIconName,
      leftIcon,
      rightIcon,
      secureTextEntry,
      secureToggle,
      variant = "outline",
      size = "md",
      containerStyle,
      inputContainerStyle,
      inputStyle,
      onRightIconPress,
      onLeftIconPress,
      editable = true,
      placeholderTextColor,
      minLength,
      maxLength,
      showCharacterCount,
      value,
      ...inputProps
    },
    ref,
  ) => {
    const t = useTheme();
    const inputRef = useRef<TextInput>(null);
    const [secure, setSecure] = useState(!!secureTextEntry);

    // Track current length for character count
    const currentLength = value?.length ?? 0;

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => inputRef.current?.clear(),
    }));

    // sizing
    const padV =
      size === "sm" ? t.spacing.xs : size === "lg" ? t.spacing.m : t.spacing.s;
    const padH =
      size === "sm" ? t.spacing.s : size === "lg" ? t.spacing.xl : t.spacing.m;
    const font = size === "sm" ? 14 : size === "lg" ? 16 : 15;
    const icon = size === "sm" ? 16 : size === "lg" ? 20 : 18;

    const bg = variant === "filled" ? t.colors.surfaceAlt : t.colors.surface;
    const borderColor = error ? t.colors.error : t.colors.border;
    const isEditable = editable && !disabled;

    const Left = () => {
      if (leftIcon)
        return <View style={{ marginRight: t.spacing.xs }}>{leftIcon}</View>;
      if (!leftIconName) return null;
      const N = (
        <Ionicons
          name={leftIconName}
          size={icon}
          color={t.colors.textSecondary}
        />
      );
      return onLeftIconPress ? (
        <TouchableOpacity
          onPress={onLeftIconPress}
          style={{ marginRight: t.spacing.xs }}
        >
          {N}
        </TouchableOpacity>
      ) : (
        <View style={{ marginRight: t.spacing.xs }}>{N}</View>
      );
    };

    const Right = () => {
      if (secureToggle) {
        const name = secure ? "eye-off-outline" : "eye-outline";
        return (
          <TouchableOpacity
            onPress={() => setSecure((s) => !s)}
            hitSlop={8}
            style={{ marginLeft: t.spacing.xs }}
          >
            <Ionicons name={name} size={icon} color={t.colors.textSecondary} />
          </TouchableOpacity>
        );
      }
      if (rightIcon)
        return <View style={{ marginLeft: t.spacing.xs }}>{rightIcon}</View>;
      if (!rightIconName) return null;
      const N = (
        <Ionicons
          name={rightIconName}
          size={icon}
          color={t.colors.textSecondary}
        />
      );
      return onRightIconPress ? (
        <TouchableOpacity
          onPress={onRightIconPress}
          style={{ marginLeft: t.spacing.xs }}
        >
          {N}
        </TouchableOpacity>
      ) : (
        <View style={{ marginLeft: t.spacing.xs }}>{N}</View>
      );
    };

    return (
      <View style={containerStyle}>
        {/* Field shell with notched label */}
        <TouchableOpacity
          onPress={() => inputRef.current?.focus()}
          className="rounded-xl"
          style={[
            {
              borderWidth: 1,
              borderColor,
              backgroundColor: bg,
              paddingVertical: padV,
              paddingHorizontal: padH,
              opacity: isEditable ? 1 : 0.6,
            },
            // create stacking context for absolute label
            { position: "relative" },
            inputContainerStyle,
          ]}
        >
          {/* LABEL sitting on the border (notch) */}
          {!!label && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: padH - 4, // tuck into left padding
                top: -8, // sit on the border line
                backgroundColor: bg, // mask the border behind label
                paddingHorizontal: 6,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: error ? t.colors.error : t.colors.textSecondary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {label}
                {required ? (
                  <Text style={{ color: t.colors.error }}>*</Text>
                ) : null}
              </Text>
            </View>
          )}

          {/* Content row */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Left />
            <TextInput
              ref={inputRef}
              {...inputProps}
              value={value}
              maxLength={maxLength}
              editable={isEditable}
              secureTextEntry={secure}
              placeholderTextColor={
                placeholderTextColor ?? t.colors.textSecondary
              }
              className="flex-1"
              style={[
                {
                  color: t.colors.textPrimary,
                  fontSize: font,
                  paddingVertical: 5,
                },
                inputStyle as TextStyle,
              ]}
            />
            <Right />
          </View>
        </TouchableOpacity>

        {/* Footer row: hint/error + character count */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: hint || error || showCharacterCount ? 6 : 0,
          }}
        >
          {/* helper/error text */}
          {!!(hint || error) ? (
            <Text
              style={{
                color: error ? t.colors.error : t.colors.textSecondary,
                fontSize: 12,
                flex: 1,
              }}
            >
              {error || hint}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {/* Character count */}
          {showCharacterCount && (
            <Text
              style={{
                color:
                  minLength && currentLength < minLength
                    ? t.colors.error
                    : maxLength && currentLength > maxLength * 0.9
                      ? (t.colors.warning ?? "#F59E0B")
                      : t.colors.textSecondary,
                fontSize: 12,
                marginLeft: 8,
              }}
            >
              {maxLength ? `${currentLength}/${maxLength}` : `${currentLength}`}
            </Text>
          )}
        </View>
      </View>
    );
  },
);

TextField.displayName = "TextField";

export default React.memo(TextField);
