import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButton from "../inputs/ActionButton";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  children?: React.ReactNode; // e.g. an event summary card
  /** Center the card on screen instead of the default bottom sheet. */
  centered?: boolean;
  /**
   * When set, the secondary action becomes an outlined button whose fill
   * animates left→right over this many ms (countdown shown in its label),
   * then fires `onSecondaryAction` once. Tapping either action cancels it.
   */
  secondaryCountdownMs?: number;
};

// Global success/confirmation bottom sheet — reused for "You're in!" (join)
// and "Event Published!" (create) per the reference designs, so the app
// doesn't grow a second one-off success screen for every new flow.
const SuccessModal = memo(function SuccessModal({
  visible,
  onClose,
  title,
  subtitle,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  children,
  centered = false,
  secondaryCountdownMs,
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  // One-shot check-icon entrance: fade + scale in, then a small settle bounce.
  const anim = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    anim.setValue(0);
    bounce.setValue(0);
    const ease = Easing.out(Easing.cubic);
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 320, easing: ease, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 240, easing: ease, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 3, duration: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
  }, [visible, anim, bounce]);

  // Countdown fill lives inside the secondary button; `settled` guards against
  // double navigation (auto-fire vs. manual tap).
  const fill = useRef(new Animated.Value(0)).current;
  const settled = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const onSecondaryRef = useRef(onSecondaryAction);
  onSecondaryRef.current = onSecondaryAction;

  useEffect(() => {
    if (!visible || !secondaryCountdownMs) return;
    settled.current = false;
    setRedirecting(false);
    fill.setValue(0);
    setSecondsLeft(Math.ceil(secondaryCountdownMs / 1000));
    const id = fill.addListener(({ value }) => {
      const left = Math.max(1, Math.ceil((1 - value) * (secondaryCountdownMs / 1000)));
      setSecondsLeft((prev) => (prev === left ? prev : left));
    });
    const run = Animated.timing(fill, {
      toValue: 1,
      duration: secondaryCountdownMs,
      easing: Easing.linear,
      useNativeDriver: false, // animating width
    });
    run.start(({ finished }) => {
      if (!finished || settled.current) return;
      settled.current = true;
      setRedirecting(true);
      onSecondaryRef.current?.();
    });
    return () => {
      settled.current = true;
      run.stop();
      fill.removeListener(id);
    };
  }, [visible, secondaryCountdownMs, fill]);

  const cancelCountdown = () => {
    settled.current = true;
    fill.stopAnimation();
  };

  const handleSecondary = () => {
    if (secondaryCountdownMs) {
      if (redirecting) return; // auto-redirect already fired
      cancelCountdown();
    }
    (onSecondaryAction ?? onClose)();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType={centered ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: centered ? "center" : "flex-end",
          alignItems: centered ? "center" : "stretch",
          paddingHorizontal: centered ? t.spacing.l : 0,
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: t.colors.cardBackground,
            borderRadius: centered ? t.radii.large : undefined,
            borderTopLeftRadius: t.radii.large,
            borderTopRightRadius: t.radii.large,
            width: centered ? "100%" : undefined,
            paddingHorizontal: t.spacing.l,
            paddingTop: t.spacing.xl,
            paddingBottom: centered ? t.spacing.l : insets.bottom + t.spacing.l,
            alignItems: "center",
          }}
        >
          <Animated.View
            style={{
              opacity: anim,
              transform: [{ translateY: bounce }, { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: t.colors.brandWeak,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: t.spacing.m,
            }}
          >
            <Ionicons name="checkmark" size={40} color={t.colors.brandDark} />
          </Animated.View>

          <Text style={[t.typography.h2, { color: t.colors.heading2, textAlign: "center" }]}>{title}</Text>
          {subtitle ? (
            <Text style={[t.typography.body, { color: t.colors.secondaryText, textAlign: "center", marginTop: t.spacing.xs }]}>
              {subtitle}
            </Text>
          ) : null}

          {children ? <View style={{ width: "100%", marginTop: t.spacing.l }}>{children}</View> : null}

          {primaryActionLabel ? (
            <ActionButton
              title={primaryActionLabel}
              onPress={() => {
                if (secondaryCountdownMs) cancelCountdown();
                (onPrimaryAction ?? onClose)();
              }}
              variant="primary"
              size="lg"
              fullWidth
              containerStyle={{
                marginTop: t.spacing.l,
                width: "100%",
                backgroundColor: t.colors.brandDark,
                borderRadius: t.radii.round,
              }}
            />
          ) : null}
          {secondaryActionLabel && secondaryCountdownMs ? (
            <Pressable
              onPress={handleSecondary}
              style={{
                marginTop: t.spacing.m,
                width: "100%",
                minHeight: 52,
                borderRadius: t.radii.round,
                borderWidth: 1.5,
                borderColor: t.colors.brandDark,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: t.colors.cardBackground,
              }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: t.colors.brand + "40",
                  width: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                }}
              />
              <Text style={[t.typography.body, { color: t.colors.brandDark, fontFamily: "Manrope_700Bold", fontWeight: "700" }]}>
                {redirecting ? "Redirecting to Home..." : `${secondaryActionLabel} (${secondsLeft}s)`}
              </Text>
            </Pressable>
          ) : secondaryActionLabel ? (
            <Text
              onPress={onSecondaryAction ?? onClose}
              style={[t.typography.body, { color: t.colors.secondaryText, marginTop: t.spacing.m }]}
            >
              {secondaryActionLabel}
            </Text>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
});

export default SuccessModal;
