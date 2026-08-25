// Bridges the new uiTheme colors with the app's EXISTING dark/light state
// (theme.ts's useTheme().isDark) instead of creating a second independent
// dark-mode system.
import { useTheme } from "@/theme/theme";
import { colors, darkColors, uiTheme } from "@/theme/uiTheme";

export function useUiTheme() {
  const { isDark } = useTheme();
  return { ...uiTheme, colors: isDark ? darkColors : colors, isDark };
}
