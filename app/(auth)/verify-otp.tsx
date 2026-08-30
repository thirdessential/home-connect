import { AUTH_PAGE, TERRACE_AUTH, TERRACE_COLORS } from "@/assets/constants/auth.constant";
import { images } from "@/assets/images";
import TerraceHeader from "@/components/auth/TerraceHeader";
import { useToast } from "@/components/common/Toast";
import ActionButton from "@/components/inputs/ActionButton";
import BoxedOTP from "@/components/inputs/BoxedOTP";
import { useAuthStore } from "@/store/useAuthStore";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const { showToast } = useToast();
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

  const handleOtpChange = useCallback((value: string) => {
    setOtp(value);
    setError(false);
  }, []);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login");
  }, []);

  const handleVerify = useCallback(async () => {
    // Guard against duplicate taps / double navigation.
    if (submittingRef.current) return;
    Keyboard.dismiss();
    if (otp.length !== AUTH_PAGE.OTP_LENGTH) {
      setError(true);
      showToast(TERRACE_AUTH.invalidOtp, "error");
      return;
    }
    submittingRef.current = true;
    try {
      await verifyOtp(phone, otp);
      showToast(TERRACE_AUTH.verifiedToast, "success");
      // Guard against navigating twice even if a success handler were ever
      // triggered more than once (e.g. a duplicate resolved promise).
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        router.replace("/onboarding/location-permission");
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

  const handleResend = useCallback(async () => {
    if (secondsLeft > 0 || isSendingOtp) return;
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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <TerraceHeader compact onBack={goBack} />

        <Text style={styles.title}>{TERRACE_AUTH.otpTitle}</Text>

        <Text style={styles.sentText}>{TERRACE_AUTH.otpSentPre}</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.phoneText}>
            {TERRACE_AUTH.countryCode} {formatPhone(phone)}
          </Text>
          <Pressable onPress={goBack} hitSlop={10} accessibilityLabel="Edit number">
            <Ionicons
              name="pencil"
              size={getWidth(18)}
              color={TERRACE_COLORS.orange}
              style={{ marginLeft: getWidth(8) }}
            />
          </Pressable>
        </View>

        <View style={styles.otpWrap}>
          <BoxedOTP value={otp} onChange={handleOtpChange} autoFocus error={error} />
        </View>

        <Image
          source={images.OtpBgimage}
          style={styles.hero}
          contentFit="cover"
          transition={200}
        />

        <ActionButton
          title={TERRACE_AUTH.continue}
          onPress={handleVerify}
          variant="primary"
          size="lg"
          fullWidth
          loading={isVerifyingOtp}
          disabled={otp.length !== AUTH_PAGE.OTP_LENGTH || isVerifyingOtp}
          containerStyle={styles.continueBtn}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendMuted}>{TERRACE_AUTH.didntReceive} </Text>
          {canResend ? (
            <Text
              style={styles.resendCta}
              onPress={handleResend}
              accessibilityRole="button"
            >
              {TERRACE_AUTH.resendCta}
            </Text>
          ) : (
            <Text style={styles.resendCta}>
              {TERRACE_AUTH.resendIn} {formatTimer(secondsLeft)}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={getWidth(16)}
            color={TERRACE_COLORS.textMuted}
          />
          <Text style={styles.footerText}>{TERRACE_AUTH.safeFooter}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TERRACE_COLORS.screenBg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(12),
    paddingBottom: getHeight(24),
  },
  title: {
    fontSize: getWidth(26),
    fontWeight: "600",
    color: TERRACE_COLORS.textDark,
    textAlign: "center",
    marginTop: getHeight(24),
  },
  sentText: {
    fontSize: getWidth(15),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(12),
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: getHeight(4),
  },
  phoneText: {
    fontSize: getWidth(18),
    fontWeight: "600",
    color: TERRACE_COLORS.textDark,
  },
  otpWrap: {
    marginTop: getHeight(28),
  },
  hero: {
    height: getHeight(300),
    marginTop: getHeight(28),
    // Edge-to-edge: break out of the scroll container's horizontal padding.
    marginHorizontal: -getWidth(24),
    backgroundColor: "#EDE7DD",
  },
  continueBtn: {
    marginTop: getHeight(24),
    borderRadius: getWidth(28),
    paddingVertical: getHeight(16),
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: getHeight(18),
  },
  resendMuted: {
    fontSize: getWidth(14),
    color: TERRACE_COLORS.textDark,
    fontWeight: "600",
  },
  resendCta: {
    fontSize: getWidth(14),
    color: TERRACE_COLORS.orange,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: getHeight(20),
  },
  footerText: {
    fontSize: getWidth(13),
    color: TERRACE_COLORS.textMuted,
    marginLeft: getWidth(8),
  },
});
