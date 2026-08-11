import { StyleProp, ViewStyle } from "react-native";

export interface ImageCarouselProps {
    images: string[]; // one or more image URLs
    height?: number; // default 200
    borderRadius?: number; // default theme.radii.l
    style?: StyleProp<ViewStyle>; // extra wrapper styles
    contentFit?: "cover" | "contain";
    showDots?: boolean; // default true (auto-hidden if only 1 image)
};