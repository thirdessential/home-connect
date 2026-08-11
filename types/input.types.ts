import { Ionicons } from "@expo/vector-icons";
import {
    GestureResponderEvent,
    StyleProp,
    TextInputProps,
    TextStyle,
    ViewStyle,
} from "react-native";

export type CTAButtonProps = {
    title: string;
    onPress?: (e: GestureResponderEvent) => void;
    href?: string; // optional: navigate on press
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    leftIconName?: keyof typeof Ionicons.glyphMap;
    rightIconName?: keyof typeof Ionicons.glyphMap;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    testID?: string;
    accessibilityLabel?: string;
};

export type TextFieldProps = Omit<TextInputProps, "onChange"> & {
    label?: string; // shown as a notch on the border
    hint?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;

    leftIconName?: keyof typeof Ionicons.glyphMap;
    rightIconName?: keyof typeof Ionicons.glyphMap;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    secureToggle?: boolean;

    variant?: "outline" | "filled"; // background style; label is always notched
    size?: "sm" | "md" | "lg";

    minLength?: number;
    showCharacterCount?: boolean;

    containerStyle?: StyleProp<ViewStyle>;
    inputContainerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    onRightIconPress?: () => void;
    onLeftIconPress?: () => void;
    testID?: string;
};

export type TextFieldHandle = {
    focus: () => void;
    blur: () => void;
    clear: () => void;
};
