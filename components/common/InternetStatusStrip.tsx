import { checkInternetConnection } from "@/lib/connectivity";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useProductStore } from "@/store/useBusinessStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { OFFLINE_STRIP_HEIGHT, bottomNavFootprint, offlineStripInset, setBannerState } from "@/lib/offlineStripInset";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CONNECTED_VISIBLE_MS = 3000;
const CHECK_INTERVAL_MS = 5000;

export default function InternetStatusStrip() {
  const insets = useSafeAreaInsets();
  const [online, setOnline] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const previous = useRef<boolean | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Android only: keep the strip mounted until its slide-down finishes.
  const [rendered, setRendered] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;

  // Where the bottom nav's top edge is (0 = no nav on this screen).
  const [navBottom, setNavBottom] = useState(0);
  useEffect(() => {
    const id = bottomNavFootprint.addListener(({ value }) => setNavBottom(value));
    return () => bottomNavFootprint.removeListener(id);
  }, []);

  useEffect(() => {
    if (visible) setRendered(true);
    const show = visible && online !== null;
    // JS driver on both so strip and navigation offset stay in lockstep.
    const config = {
      duration: show ? 320 : 260,
      easing: show ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    };
    const anim = Animated.parallel([
      Animated.timing(slide, { toValue: show ? 1 : 0, ...config }),
      Animated.timing(offlineStripInset, {
        toValue: show ? OFFLINE_STRIP_HEIGHT : 0,
        ...config,
      }),
    ]);
    anim.start(({ finished }) => {
      if (finished && !show) setRendered(false);
    });
    return () => anim.stop();
  }, [visible, online, slide]);


  useEffect(() => {
    let active = true;

    const check = async () => {
      const next = await checkInternetConnection();
      if (!active) return;
      const was = previous.current;
      previous.current = next;
      setOnline(next);

      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (!next) {
        setVisible(true);
      } else if (was === false) {
        setVisible(true);
        hideTimer.current = setTimeout(() => setVisible(false), CONNECTED_VISIBLE_MS);
        const societyId = useSocietyStore.getState().selectedSociety?._id;
        if (societyId) {
          // Reconnect refreshes the same persisted stores used by Home and
          // Directory; cached values stay visible while these run.
          useFeedsStore.getState().fetchFeedsBySociety(societyId, true).catch(() => {});
          useProductStore.getState().fetchBusinessBySocietyId(societyId).catch(() => {});
          useDailyHelperStore.getState().getAllApprovedDailyServices(societyId).catch(() => {});
        }
      } else {
        setVisible(false);
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // Published for the bottom nav, which draws the banner inside itself.
  useEffect(() => {
    setBannerState({ rendered, online });
  }, [rendered, online]);

  // With a bottom nav on screen the banner is drawn inside it (below the tab
  // items); this floating one is only for screens without a nav.
  if (navBottom > 0 || !rendered || online === null) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.strip,
        {
          // Directly above the nav bar; with no nav, above the system gesture /
          // button area — never over it. Real insets, no hard-coded padding.
          bottom: Math.max(navBottom, insets.bottom),
          height: OFFLINE_STRIP_HEIGHT,
          backgroundColor: online ? "#15803D" : "#B91C1C",
          opacity: slide,
          transform: [
            { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        },
      ]}
    >
      <Ionicons name={online ? "checkmark-circle" : "cloud-offline-outline"} size={18} color="#fff" />
      <Text style={styles.text}>{online ? "Internet Connected" : "No Internet Connection"}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: "absolute",
    left: 0,
    right: 0,
    minHeight: 30,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 10000,
    elevation: 20,
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
  },
});
