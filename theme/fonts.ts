// Single source of truth for the Manrope font family — asset map for
// useFonts() (loaded once in app/_layout.tsx) and the weight->family
// resolver used by theme.ts / uiTheme.ts / Heading / Label so every
// typography token renders the correct Manrope weight (not a synthetic
// bold, which custom fonts don't reliably support on Android/iOS).
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";

export const manropeAssets = {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
};

export function manropeFamily(weight?: string | number): string {
  switch (String(weight)) {
    case "800":
      return "Manrope_800ExtraBold";
    case "700":
      return "Manrope_700Bold";
    case "600":
      return "Manrope_600SemiBold";
    case "500":
      return "Manrope_500Medium";
    default:
      return "Manrope_400Regular";
  }
}
