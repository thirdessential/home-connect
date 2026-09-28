import { checkInternetConnection } from "@/lib/connectivity";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useProductStore } from "@/store/useBusinessStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CONNECTED_VISIBLE_MS = 3000;
const CHECK_INTERVAL_MS = 5000;

export default function InternetStatusStrip() {
  const insets = useSafeAreaInsets();
  const [online, setOnline] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const previous = useRef<boolean | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);



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

  if (!visible || online === null) return null;
  return (
    <View
      style={[
        styles.strip,
        { bottom: 0, backgroundColor: online ? "#15803D" : "#B91C1C" },
      ]}
    >
      <Ionicons name={online ? "checkmark-circle" : "cloud-offline-outline"} size={18} color="#fff" />
      <Text style={styles.text}>{online ? "Internet Connected" : "No Internet Connection"}</Text>
    </View>
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
