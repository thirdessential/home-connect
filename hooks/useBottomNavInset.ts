import { useSafeAreaInsets } from "react-native-safe-area-context";

// The floating bottom navigation overlays the screen, so scrollable tab screens
// add this to their bottom padding to let the last item scroll clear of the pill.
// Mirrors GlobalBottomNavigation: pill (68) + max(bottom inset, 10) + breathing room.
const NAV_PILL_HEIGHT = 68;
export function useBottomNavInset(): number {
  const { bottom } = useSafeAreaInsets();
  return NAV_PILL_HEIGHT + Math.max(bottom, 10) + 8;
}
