import { AUTH_PAGE, TERRACE_AUTH, TERRACE_COLORS } from "@/assets/constants/auth.constant";
import { images } from "@/assets/images";
import TerraceHeader from "@/components/auth/TerraceHeader";
import { useToast } from "@/components/common/Toast";
import ActionButton from "@/components/inputs/ActionButton";
import BoxedOTP from "@/components/inputs/BoxedOTP";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserStore } from "@/store/useUserStore";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { manropeFamily } from "@/theme/fonts";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

function formatPhone(phone: string) {
  const clean = (phone || "").replace(/\D/g, "").slice(-10);
  if (clean.length !== 10) return phone || "";
  return `${clean.slice(0, 5)} ${clean.slice(5)}`;
}

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function VerifyOtpScreen() {
  const { showStatusToast } = useToast();
  const insets = useSafeAreaInsets();
  const showToast = useCallback(
    (message: string, type: "error" | "success") => {
      if (type === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      showStatusToast({ title: type === "error" ? "Verification" : "Success", message, tone: type });
    },
    [showStatusToast],
  );
  const keyboardHeight = useKeyboardHeight();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = typeof params.phone === "string" ? params.phone : "";

  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const isVerifyingOtp = useAuthStore((s) => s.isVerifyingOtp);
  const isSendingOtp = useAuthStore((s) => s.isSendingOtp);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TERRACE_AUTH.RESEND_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittingRef = useRef(false);
  const navigatedRef = useRef(false);

  const shift = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const open = keyboardHeight > 0;
    Animated.parallel([
      Animated.timing(shift, {
        toValue: open ? -(keyboardHeight + getHeight(30)) : 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, { toValue: open ? 0 : 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [keyboardHeight, shift, logoOpacity]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSecondsLeft(TERRACE_AUTH.RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login");
  }, []);

  // `code` is passed explicitly by the auto-submit path: state set in the same
  // event as the 6th digit isn't visible to this closure yet.
  const handleVerify = useCallback(async (code: string = otp) => {
    // Guard against duplicate taps / double navigation.
    if (submittingRef.current) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (code.length !== AUTH_PAGE.OTP_LENGTH) {
      setError(true);
      showToast(TERRACE_AUTH.invalidOtp, "error");
      return;
    }
    submittingRef.current = true;
    try {
      await verifyOtp(phone, code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showToast(TERRACE_AUTH.verifiedToast, "success");
      // Guard against navigating twice even if a success handler were ever
      // triggered more than once (e.g. a duplicate resolved promise).
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        // Backend already links this user to a society (set during a prior
        // onboarding pass) — skip location/select-society and go straight
        // home instead of forcing onboarding again on every login.
        const hasSociety = !!useUserStore.getState().user?.societyId;
        router.replace(
          hasSociety ? "/(tabs)/home" : "/onboarding/location-permission",
        );
      }
    } catch (err: any) {
      setError(true);
      const message =
        err?.message || TERRACE_AUTH.otpVerifyFailed || TERRACE_AUTH.invalidOtp;
      showToast(message, "error");
    } finally {
      submittingRef.current = false;
    }
  }, [otp, phone, showToast, verifyOtp]);

  // Typing the 6th digit, pasting, or SMS autofill all arrive here with the
  // complete code — verify immediately, no button press. submittingRef (in
  // handleVerify) keeps it to one request per complete code.
  const handleOtpChange = useCallback(
    (value: string) => {
      setOtp(value);
      setError(false);
      if (value.length === AUTH_PAGE.OTP_LENGTH) handleVerify(value);
    },
    [handleVerify],
  );

  const handleResend = useCallback(async () => {
    if (secondsLeft > 0 || isSendingOtp) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setOtp("");
    setError(false);
    try {
      await sendOtp(phone);
      startTimer();
      showToast(TERRACE_AUTH.otpResentToast, "success");
    } catch (err: any) {
      showToast(err?.message || TERRACE_AUTH.otpSendFailed, "error");
    }
  }, [secondsLeft, isSendingOtp, phone, sendOtp, startTimer, showToast]);

  const canResend = secondsLeft === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.flex}>
        <Animated.View style={[styles.top, { opacity: logoOpacity }]}>
          <TerraceHeader onBack={goBack} />
        </Animated.View>

        <HeroImage />
    

        <Animated.View style={[styles.cardWrap, { transform: [{ translateY: shift }] }]}>
          <View style={[styles.card, { paddingBottom: insets.bottom + getHeight(20) }]}>
            <Text style={styles.title}>Verify Your Number</Text>
            <Text style={styles.sentText}>
              We've sent a 6-digit verification code to your mobile number.
            </Text>

            <View style={styles.phonePill}>
              <Ionicons name="call" size={getWidth(16)} color={TERRACE_COLORS.orange} />
              <Text style={styles.phoneText}>
                {TERRACE_AUTH.countryCode} {formatPhone(phone)}
              </Text>
              <Pressable
                onPress={goBack}
                hitSlop={10}
                style={styles.editBtn}
                accessibilityRole="button"
                accessibilityLabel="Edit number"
              >
                <Ionicons name="pencil" size={getWidth(14)} color={TERRACE_COLORS.orange} />
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.otpWrap}>
              <BoxedOTP value={otp} onChange={handleOtpChange} error={error} />
            </View>

            <Text style={styles.didnt}>Didn't receive the code?</Text>
            <View style={styles.resendRow}>
              {!canResend ? (
                <View style={styles.timerPill}>
                  <Ionicons name="timer-outline" size={getWidth(14)} color={TERRACE_COLORS.textDark} />
                  <Text style={styles.timerText}>Resend code in {formatTimer(secondsLeft)}</Text>
                </View>
              ) : null}
              <Text
                style={[styles.resendCta, canResend && styles.resendCtaOn]}
                onPress={canResend ? handleResend : undefined}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canResend }}
              >
                {TERRACE_AUTH.resendCta}
              </Text>
            </View>

            <ActionButton
              title="Verify"
              onPress={() => handleVerify()}
              variant="primary"
              size="lg"
              fullWidth
              loading={isVerifyingOtp}
              disabled={isVerifyingOtp}
              containerStyle={styles.verifyBtn}
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// Memoised so typing / timer ticks never re-render the image.
const HeroImage = React.memo(function HeroImage() {
  return (
    <View style={styles.heroWrap}>
      <Image
        source={images.OtpBgimage}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="top"
        transition={200}
        cachePolicy="memory-disk"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  safe: { flex: 1, overflow: "hidden", backgroundColor: TERRACE_COLORS.screenBg },
  flex: { flex: 1 },
  top: {
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(8),
    paddingBottom: getHeight(10),
    backgroundColor: TERRACE_COLORS.screenBg,
  },
  heroWrap: { flex:1, minHeight: 0, overflow: "hidden", backgroundColor: "#EDE7DD"},
  cardWrap: { marginTop: -getHeight(28), flexShrink: 0 },
  card: {
    backgroundColor: TERRACE_COLORS.screenBg,
    borderTopLeftRadius: getWidth(32),
    borderTopRightRadius: getWidth(32),
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(22),
  },
  title: {
    fontSize: getWidth(24),
    lineHeight: getWidth(28),
    fontFamily: manropeFamily("700"),
    color: TERRACE_COLORS.textDark,
    textAlign: "center",
  },
  sentText: {
    fontSize: getWidth(10),
    lineHeight: getWidth(15),
    fontFamily: manropeFamily("500"),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(6),
  },
  phonePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#E5E5E532",
    borderRadius: 999,
    paddingVertical: getHeight(8),
    paddingHorizontal: getWidth(16),
    marginTop: getHeight(12),
  },
  phoneText: {
    fontSize: getWidth(14),
    fontFamily: manropeFamily("700"),
    color: TERRACE_COLORS.textDark,
    marginLeft: getWidth(8),
  },
  editBtn: { flexDirection: "row", alignItems: "center", marginLeft: getWidth(14) },
  editText: {
    fontSize: getWidth(14),
    fontFamily: manropeFamily("700"),
    color: TERRACE_COLORS.orange,
    marginLeft: getWidth(4),
  },
  otpWrap: { marginTop: getHeight(16) },
  didnt: {
    fontSize: getWidth(12),
    fontFamily: manropeFamily("500"),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(10),
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: getHeight(8),
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F060",
    borderRadius: 999,
    paddingVertical: getHeight(6),
    paddingHorizontal: getWidth(10),
    marginRight: getWidth(12),
  },
  timerText: {
    fontSize: getWidth(11),
    fontFamily: manropeFamily("600"),
    color: TERRACE_COLORS.textDark,
    marginLeft: getWidth(4),
  },
  resendCta: {
    fontSize: getWidth(14),
    fontFamily: manropeFamily("600"),
    color: "#B5B9C0",
  },
  resendCtaOn: { color: TERRACE_COLORS.orange, fontFamily: manropeFamily("700") },
  verifyBtn: {
    marginTop: getHeight(18),
    borderRadius: 999,
    paddingVertical: getHeight(15),
  },
});
