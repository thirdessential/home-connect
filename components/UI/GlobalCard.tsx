import { memo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useUiTheme } from "./useUiTheme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
};

const GlobalCard = memo(function GlobalCard({ children, style, noPadding }: Props) {
  const t = useUiTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.colors.card,
          borderRadius: t.radius.lg,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: noPadding ? 0 : t.spacing.lg,
          shadowColor: "#000",
          shadowOpacity: t.isDark ? 0 : 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: t.isDark ? 0 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});

export default GlobalCard;
