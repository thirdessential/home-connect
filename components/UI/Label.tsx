import { useTheme } from "@/theme/theme";
import { memo } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  required?: boolean;
  style?: StyleProp<TextStyle>;
};

// Global label primitive — consistent font/size/color/weight for every
// post-login form field label. Accepts a style override for one-off tweaks.
const Label = memo(function Label({ children, required, style }: Props) {
  const t = useTheme();
  return (
    <Text
      style={[
        t.typography.label,
        { color: t.colors.text, marginBottom: t.spacing.xs, fontFamily: t.typography.fontFamily },
        style,
      ]}
    >
      {children}
      {required ? <Text style={{ color: t.colors.error }}> *</Text> : null}
    </Text>
  );
});

export default Label;
