import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Modal, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  subtitle?: string;
  autoHideMs?: number;
};

export default function OrderSuccessModal({
  visible,
  onDismiss,
  title = "Order Placed!",
  subtitle = "You've successfully joined the deal.",
  autoHideMs = 1800,
}: Props) {
  const t = useTheme();
  const overlay = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    // fade in overlay and pop the circle
    Animated.parallel([
      Animated.timing(overlay, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }),
    ]).start(() => {
      Animated.sequence([
        Animated.spring(checkScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
        }),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(textY, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    const timer = setTimeout(() => {
      // fade out
      Animated.timing(overlay, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // reset for next time
        scale.setValue(0.6);
        checkScale.setValue(0);
        textY.setValue(20);
        textOpacity.setValue(0);
        onDismiss();
      });
    }, autoHideMs);
    return () => clearTimeout(timer);
  }, [
    visible,
    overlay,
    scale,
    checkScale,
    textOpacity,
    textY,
    onDismiss,
    autoHideMs,
  ]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: overlay.interpolate({
            inputRange: [0, 1],
            outputRange: ["rgba(0,0,0,0)", "rgba(0,0,0,0.45)"],
          }) as unknown as string,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        {/* Success circle */}
        <Animated.View
          style={{
            transform: [{ scale }],
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(16,185,129,0.15)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: "#10B981",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="checkmark" size={42} color="#fff" />
            </View>
          </Animated.View>
        </Animated.View>

        {/* Texts */}
        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ translateY: textY }],
            opacity: textOpacity,
          }}
        >
          <View
            style={{
              backgroundColor: t.colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>
              {title}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: t.colors.primaryStrong,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>{subtitle}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
