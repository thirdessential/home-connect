import { useSyncExternalStore } from "react";
import { Animated } from "react-native";

// Height of the connectivity strip. The strip animates `offlineStripInset`
// in/out; the bottom navigation reserves that much space above itself so the
// strip sits directly over the nav bar and never covers it.
export const OFFLINE_STRIP_HEIGHT = 30;
export const offlineStripInset = new Animated.Value(0);

// Height (px) of the bottom navigation body, including its bottom safe-area
// padding, as measured on layout. 0 when no bottom nav is on screen. The strip
// anchors itself here so it always sits immediately above the nav.
export const bottomNavFootprint = new Animated.Value(0);

// Connectivity banner state, published by InternetStatusStrip (which owns the
// detection logic) and read by the bottom nav so the banner can live INSIDE the
// nav, below the tab items.
export type BannerState = { rendered: boolean; online: boolean | null };
let bannerState: BannerState = { rendered: false, online: null };
const bannerListeners = new Set<() => void>();
export const setBannerState = (next: BannerState) => {
  if (next.rendered === bannerState.rendered && next.online === bannerState.online) return;
  bannerState = next;
  bannerListeners.forEach((l) => l());
};
export const useBannerState = (): BannerState =>
  useSyncExternalStore(
    (cb) => {
      bannerListeners.add(cb);
      return () => bannerListeners.delete(cb);
    },
    () => bannerState,
  );
