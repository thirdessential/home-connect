import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "error" | "success" | "info" | "warning";

type ToastState = { message: string; type: ToastType } | null;

type StatusToast = {
  title: string;
  message: string;
  /** "success" = green, "neutral" = soft red/neutral (e.g. a rejection that succeeded). */
  tone: "success" | "neutral" | "error";
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
  /** Modern top toast with title + message; duplicates of the visible one are ignored. */
  showStatusToast: (t: StatusToast) => void;
};

const STATUS_TONES: Record<StatusToast["tone"], { bg: string; border: string; icon: string; title: string; text: string; name: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: "#E8F5E9", border: "#C8E6C9", icon: "#16803C", title: "#14532D", text: "#166534", name: "checkmark-circle" },
  neutral: { bg: "#FDECEC", border: "#F8CFCF", icon: "#C62828", title: "#7F1D1D", text: "#991B1B", name: "checkmark-circle" },
  error: { bg: "#FDECEC", border: "#F8CFCF", icon: "#C62828", title: "#7F1D1D", text: "#991B1B", name: "close-circle" },
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANTS: Record<
  ToastType,
  { bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  error: { bg: "#DC2626", icon: "close-circle" },
  success: { bg: "#16A34A", icon: "checkmark-circle" },
  info: { bg: "#1F2937", icon: "information-circle" },
  warning: { bg: "#D97706", icon: "warning" },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>(null);
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, type: ToastType = "error") => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, type });
      translateY.setValue(120);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 80,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      hideTimer.current = setTimeout(hide, 2500);
    },
    [hide, opacity, translateY],
  );

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  // ---- status toast (top) ----
  const [status, setStatus] = useState<StatusToast | null>(null);
  const statusY = useRef(new Animated.Value(-140)).current;
  const statusOpacity = useRef(new Animated.Value(0)).current;
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusKey = useRef<string | null>(null);

  const hideStatus = useCallback(() => {
    Animated.parallel([
      Animated.timing(statusY, { toValue: -140, duration: 240, useNativeDriver: true }),
      Animated.timing(statusOpacity, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start(() => {
      statusKey.current = null;
      setStatus(null);
    });
  }, [statusOpacity, statusY]);

  const showStatusToast = useCallback(
    (t: StatusToast) => {
      const key = `${t.tone}|${t.title}|${t.message}`;
      if (statusKey.current === key) return; // same toast already on screen
      statusKey.current = key;
      if (statusTimer.current) clearTimeout(statusTimer.current);
      setStatus(t);
      statusY.setValue(-140);
      statusOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(statusY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 70 }),
        Animated.timing(statusOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      statusTimer.current = setTimeout(hideStatus, 2800);
    },
    [hideStatus, statusOpacity, statusY],
  );

  useEffect(
    () => () => {
      if (statusTimer.current) clearTimeout(statusTimer.current);
    },
    [],
  );

  const value = useMemo(() => ({ showToast, showStatusToast }), [showToast, showStatusToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {status ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.statusWrap,
            { top: insets.top + getHeight(8), transform: [{ translateY: statusY }], opacity: statusOpacity },
          ]}
        >
          <View
            style={[
              styles.statusToast,
              { backgroundColor: STATUS_TONES[status.tone].bg, borderColor: STATUS_TONES[status.tone].border },
            ]}
          >
            <Ionicons name={STATUS_TONES[status.tone].name} size={getWidth(26)} color={STATUS_TONES[status.tone].icon} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Manrope_700Bold", fontSize: getWidth(15), color: STATUS_TONES[status.tone].title }}>
                {status.title}
              </Text>
              <Text style={{ fontFamily: "Manrope_500Medium", fontSize: getWidth(13), color: STATUS_TONES[status.tone].text, marginTop: 2 }} numberOfLines={2}>
                {status.message}
              </Text>
            </View>
          </View>
        </Animated.View>
      ) : null}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            { bottom: insets.bottom + getHeight(78), transform: [{ translateY }], opacity },
          ]}
        >
          <View style={[styles.toast, { backgroundColor: VARIANTS[toast.type].bg }]}>
            <Ionicons
              name={VARIANTS[toast.type].icon}
              size={getWidth(20)}
              color="#fff"
            />
            <Text style={styles.text} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};

const styles = StyleSheet.create({
  statusWrap: {
    position: "absolute",
    left: getWidth(16),
    right: getWidth(16),
    zIndex: 10000,
    elevation: 10000,
  },
  statusToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: getWidth(12),
    paddingVertical: getHeight(12),
    paddingHorizontal: getWidth(14),
    borderRadius: getWidth(16),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  wrap: {
    position: "absolute",
    left: getWidth(16),
    right: getWidth(16),
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: getWidth(16),
    paddingVertical: getHeight(12),
    borderRadius: getWidth(12),
    maxWidth: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    color: "#fff",
    fontSize: getWidth(14),
    fontFamily: "Manrope_600SemiBold",
    marginLeft: getWidth(10),
    flex: 1,
    flexShrink: 1,
  },
});
