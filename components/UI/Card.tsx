import { useTheme } from "@/theme/theme";
import { CardWrapperProps } from "@/types/common.type";
import { memo, useMemo } from "react";
import { View } from "react-native";

const CardWrapper = ({ children, style, KeyId }: CardWrapperProps) => {
  const t = useTheme();
  const combinedStyle = useMemo(
    () => [
      {
        backgroundColor: t.colors.surface,
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: t.colors.border,
        // // iOS
        // shadowColor: "#6b6b6b42",
        // shadowOffset: { width: 0, height: 3 },
        // shadowOpacity: t.isDark ? 0.28 : 0.08,
        // shadowRadius: 10,
        // // Android
        // elevation: 4,
      },
      style,
    ],
    [t.colors.surface, style]
  );
  return (
    <View style={combinedStyle} key={KeyId}>
      {children}
    </View>
  );
};

export const Card = memo(CardWrapper);