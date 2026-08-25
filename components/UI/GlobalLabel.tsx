import { memo } from "react";
import { Text } from "react-native";
import { useUiTheme } from "./useUiTheme";

type Props = { children: React.ReactNode; required?: boolean };

const GlobalLabel = memo(function GlobalLabel({ children, required }: Props) {
  const t = useUiTheme();
  return (
    <Text style={[t.typography.label, { color: t.colors.textPrimary, marginBottom: t.spacing.xs }]}>
      {children}
      {required ? <Text style={{ color: t.colors.error }}> *</Text> : null}
    </Text>
  );
});

export default GlobalLabel;
