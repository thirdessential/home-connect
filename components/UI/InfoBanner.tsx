import { InfoBannerProps, InfoBannerType } from "@/types/common.type";
import { Ionicons } from "@expo/vector-icons";
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
  variant = "default",
  icon,
}: InfoBannerProps) {
  const defaults = TYPE_STYLES[type];
  const bg = backgroundColor ?? defaults.backgroundColor;
  const border = borderColor ?? defaults.borderColor;
  const tColor = titleColor ?? defaults.titleColor;
  const dColor = descriptionColor ?? defaults.descriptionColor;

  // Opt-in premium layout — every existing (default) usage below is
  // untouched, so other InfoBanner call sites keep their exact appearance.
  if (variant === "card") {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
          padding: 12,
          borderRadius: 14,
          // Uniform borderWidth+borderColor made every edge the same faint
          // gray, so the left edge read as "missing" next to the other
          // (visually louder) card content. Give the left edge its own
          // width/color — same borderLeftWidth+borderRadius pairing the
          // default variant below already uses — so it reads as a clear
          // pending-colored accent while top/right/bottom stay a subtle
          // neutral border and the shared borderRadius still rounds all
          // four corners.
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderLeftWidth: 1,
          borderColor: "#54b3d3aa",
          borderLeftColor: "#54b3d3c3",
          backgroundColor: "#c0efff0c",
          marginBottom: 12,
          marginHorizontal: 8,
          ...containerStyle,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: "#54b3d31c",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon ?? "shield-checkmark-outline"} size={18} color="#54b3d3" />
        </View>

        <View style={{ flex: 1 }}>
          {title && (
            <Text
              style={{ fontSize: 14.5, fontWeight: "700", color: "#1F2937", marginBottom: 2 }}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {description && (
            <Text style={{ fontSize: 12.5, lineHeight: 17, color: "#6B7280" }} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
      </View>
    );
  }

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
