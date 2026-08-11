import {
  TERMS_BODY,
  TERRACE_AUTH,
  TERRACE_COLORS,
} from "@/assets/constants/auth.constant";
import ActionButton from "@/components/inputs/ActionButton";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = Math.round(SCREEN_H * 0.8);

type Props = {
  visible: boolean;
  onClose: () => void;
  onAgree: () => void;
};

/**
 * Bottom sheet that slides up from the bottom with a scrollable T&C body and an
 * "I Agree" action. Supports drag-down and backdrop-tap to dismiss.
 */
export default function TermsSheet({ visible, onClose, onAgree }: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(SHEET_H);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: 320 });
      backdrop.value = withTiming(1, { duration: 320 });
    } else if (mounted) {
      backdrop.value = withTiming(0, { duration: 240 });
      translateY.value = withTiming(SHEET_H, { duration: 240 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { height: SHEET_H, paddingBottom: insets.bottom + getHeight(12) },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.grabArea}>
              <View style={styles.handle} />
              <View style={styles.headerRow}>
                <Text style={styles.title}>{TERRACE_AUTH.termsTitle}</Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons
                    name="close"
                    size={getWidth(24)}
                    color={TERRACE_COLORS.textMuted}
                  />
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator
            bounces={false}
          >
            <Text style={styles.bodyText}>{TERMS_BODY}</Text>
          </ScrollView>

          <View style={styles.footer}>
            <ActionButton
              title={TERRACE_AUTH.iAgree}
              onPress={onAgree}
              variant="primary"
              size="lg"
              fullWidth
              containerStyle={styles.agreeBtn}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: getWidth(24),
    borderTopRightRadius: getWidth(24),
    overflow: "hidden",
  },
  grabArea: {
    paddingTop: getHeight(10),
    paddingHorizontal: getWidth(20),
  },
  handle: {
    alignSelf: "center",
    width: getWidth(44),
    height: getHeight(5),
    borderRadius: getWidth(3),
    backgroundColor: "#D1D5DB",
    marginBottom: getHeight(12),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: getHeight(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TERRACE_COLORS.inputBorder,
  },
  title: {
    fontSize: getWidth(18),
    fontWeight: "800",
    color: TERRACE_COLORS.textDark,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: getWidth(20),
    paddingTop: getHeight(16),
    paddingBottom: getHeight(24),
  },
  bodyText: {
    fontSize: getWidth(14),
    lineHeight: getHeight(22),
    color: "#374151",
  },
  footer: {
    paddingHorizontal: getWidth(20),
    paddingTop: getHeight(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TERRACE_COLORS.inputBorder,
  },
  agreeBtn: {
    borderRadius: getWidth(14),
    paddingVertical: getHeight(15),
  },
});
