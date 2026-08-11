import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";

export type CategoryChipProps<T> = {
    title?: string;
    items: T[];

    // selection
    selectedId?: string | null;
    onSelect?: (id: string | null, item: T | null) => void;

    // mapping (reusable for any item shape)
    getId?: (item: T) => string;
    getLabel?: (item: T) => string;
    getIcon?: (item: T, selected: boolean) => ReactNode;
    getImage?: (item: T) => string | undefined;

    // layout
    size?: "sm" | "md" | "lg"; // chip size (default: sm)
    variant?: "outline" | "filled"; // visual style (default: outline)
    gap?: number; // space between chips (default: theme.spacing.s)
    showAllChip?: boolean; // adds an "All" chip at the start
    allLabel?: string; // default: "All"
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
};