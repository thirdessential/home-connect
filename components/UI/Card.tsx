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
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
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