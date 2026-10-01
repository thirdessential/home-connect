import { useTheme } from "@/theme/theme";
import { memo, useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text } from "react-native";

type Props = {
  label: string;
  /** Fill duration; `onComplete` fires once when it finishes. */
  durationMs?: number;
  onComplete: () => void;
};

// Same outlined fill-left→right countdown button the Event success sheet
// uses (SuccessModal's secondary action), minus the seconds in the label.
// `settled` guards against double navigation (auto-fire vs. manual tap).
const CountdownFillButton = memo(function CountdownFillButton({ label, durationMs = 3000, onComplete }: Props) {
  const t = useTheme();
  const fill = useRef(new Animated.Value(0)).current;
  const settled = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    settled.current = false;
    fill.setValue(0);
    const run = Animated.timing(fill, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: false, // animating width
    });
    run.start(({ finished }) => {
      if (!finished || settled.current) return;
      settled.current = true;
      onCompleteRef.current();
    });
    return () => {
      settled.current = true;
      run.stop();
    };
  }, [durationMs, fill]);

  const handlePress = () => {
    if (settled.current) return;
    settled.current = true;
    fill.stopAnimation();
    onCompleteRef.current();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
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
        {label}
      </Text>
    </Pressable>
  );
});

export default CountdownFillButton;
