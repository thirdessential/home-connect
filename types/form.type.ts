import { StyleProp, TextInputProps, ViewStyle } from "react-native";

export interface ImagePickerFieldProps {
    label?: string;
    mode?: "single" | "multiple"; // default: multiple
    value: string[]; // URIs (for single, keep at most 1)
    onChange: (uris: string[]) => void;
    max?: number; // default: 6 (or 1 for single)
    allowsEditing?: boolean; // crop on iOS
    quality?: number; // 0..1 default 0.85
    style?: StyleProp<ViewStyle>;
    tileSize?: number; // preview size, default 96
    disabled?: boolean;
};

export interface TextAreaProps {
    label?: string; // Optional label
    value: string;
    onChangeText: (t: string) => void;
    lines?: number; // default 3
    placeholder?: string;
    maxLength?: number;
    disabled?: boolean;
    error?: string;
    helpText?: string;
    containerStyle?: StyleProp<ViewStyle>;
    inputProps?: Omit<TextInputProps, "value" | "onChangeText" | "multiline">;
};