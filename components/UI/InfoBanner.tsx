import { InfoBannerProps, InfoBannerType } from "@/types/common.type";
import { Text, View } from "react-native";

const TYPE_STYLES: Record<
  InfoBannerType,
  {
    backgroundColor: string;
    borderColor: string;
    titleColor: string;
    descriptionColor: string;
  }
> = {
  info: {
    backgroundColor: "#EFF6FF",
    borderColor: "#60A5FA",
    titleColor: "#1D4ED8",
    descriptionColor: "#1E3A8A",
  },
  success: {
    backgroundColor: "#F0FDF4",
    borderColor: "#4ADE80",
    titleColor: "#15803D",
    descriptionColor: "#166534",
  },
  warning: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
    titleColor: "#B45309",
    descriptionColor: "#92400E",
  },
  danger: {
    backgroundColor: "#FEF2F2",
    borderColor: "#F87171",
    titleColor: "#B91C1C",
    descriptionColor: "#991B1B",
  },
};

export default function InfoBanner({
  type = "info",
  title,
  description,
  backgroundColor,
  borderColor,
  titleColor,
  descriptionColor,
  containerStyle,
}: InfoBannerProps) {
  const defaults = TYPE_STYLES[type];
  const bg = backgroundColor ?? defaults.backgroundColor;
  const border = borderColor ?? defaults.borderColor;
  const tColor = titleColor ?? defaults.titleColor;
  const dColor = descriptionColor ?? defaults.descriptionColor;

  return (
    <View
      style={{
        padding: 12,
        borderLeftWidth: 4,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: bg,
        borderLeftColor: border,
        ...containerStyle,
      }}
    >
      {title && (
        <Text style={{ fontWeight: "600", color: tColor }}>{title}</Text>
      )}
      {description && (
        <Text style={{ marginTop: 4, color: dColor }}>{description}</Text>
      )}
    </View>
  );
}
