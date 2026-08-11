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

type ToastType = "error" | "success" | "info";

type ToastState = { message: string; type: ToastType } | null;

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANTS: Record<
  ToastType,
  { bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  error: { bg: "#DC2626", icon: "alert-circle" },
  success: { bg: "#16A34A", icon: "checkmark-circle" },
  info: { bg: "#1F2937", icon: "information-circle" },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
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
      translateY.setValue(-120);
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
      hideTimer.current = setTimeout(hide, 2800);
    },
    [hide, opacity, translateY],
  );

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            { top: insets.top + getHeight(10), transform: [{ translateY }], opacity },
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
    fontWeight: "600",
    marginLeft: getWidth(10),
    flexShrink: 1,
  },
});
