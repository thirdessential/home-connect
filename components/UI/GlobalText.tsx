import { memo } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { useUiTheme } from "./useUiTheme";

export type TextVariant = keyof ReturnType<typeof useUiTheme>["typography"];

type Props = {
  variant?: TextVariant;
  children: React.ReactNode;
  color?: string;
  weight?: TextStyle["fontWeight"];
  align?: TextStyle["textAlign"];
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
};

// Single global text primitive — variant controls size/weight/lineHeight from
// uiTheme.typography; color/weight/align are the only per-usage overrides.
const GlobalText = memo(function GlobalText({
  variant = "body",
  children,
  color,
  weight,
  align,
  numberOfLines,
  style,
}: Props) {
  const t = useUiTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        t.typography[variant],
        { color: color ?? t.colors.textPrimary, textAlign: align },
        weight ? { fontWeight: weight } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
});

export default GlobalText;
