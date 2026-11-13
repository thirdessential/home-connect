import {
  TERRACE_AUTH,
  TERRACE_COLORS,
} from "@/assets/constants/auth.constant";
import { images } from "@/assets/images";
import TermsSheet from "@/components/auth/TermsSheet";
import TerraceHeader from "@/components/auth/TerraceHeader";
import { useToast } from "@/components/common/Toast";
import ActionButton from "@/components/inputs/ActionButton";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useAuthStore } from "@/store/useAuthStore";
import { manropeFamily } from "@/theme/fonts";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// Memoised so keystrokes / validation / keyboard state never re-render the image.
const HeroImage = React.memo(function HeroImage() {
  return (
    <View style={styles.heroWrap}>
      <Image
        source={images.LoginBgimage}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="top"
        transition={200}
        cachePolicy="memory-disk"
      />
    </View>
  );
});

export default function LoginScreen() {
  const { showStatusToast } = useToast();
  const showError = useCallback(
    (message: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      showStatusToast({ title: "Login", message, tone: "error" });
    },
    [showStatusToast],
  );
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const isSendingOtp = useAuthStore((s) => s.isSendingOtp);

  const [mobile, setMobile] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const submittingRef = useRef(false);

  const shift = useRef(new Animated.Value(0)).current;
  // Extra lift while the keyboard is open. Done with the native transform
  // (not an animated paddingBottom) so the card never changes the layout and
  // the flex:1 hero image is not resized/re-rendered on every frame.
  const extraLift = getHeight(30);
  useEffect(() => {
    const open = keyboardHeight > 0;
    Animated.timing(shift, {
      toValue: open ? -(keyboardHeight + extraLift) : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [keyboardHeight, shift, extraLift]);

  // const isValidMobile = /^[6-9]\d{9}$/.test(mobile);

  const handleMobileChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    setMobile(cleaned);
    setMobileError(null);
    if (cleaned.length === 10) Keyboard.dismiss();
  }, []);

  const handleContinue = useCallback(async () => {
    if (submittingRef.current) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (mobile.length === 0) {
      setMobileError("Please enter your mobile number.");
      return showError("Please enter your mobile number.");
    }
    // if (!isValidMobile) {
    //   setMobileError("Please enter a valid mobile number.");
    //   return showError("Please enter a valid mobile number.");
    // }
    if (!accepted) return showError(TERRACE_AUTH.checkTerms);

    submittingRef.current = true;
    try {
      await sendOtp(mobile);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.push({ pathname: "/(auth)/verify-otp", params: { phone: mobile } });
    } catch (err: any) {
      const message =
        err?.message || TERRACE_AUTH.otpSendFailed || "Failed to send OTP. Please try again.";
      showError(message);
    } finally {
      submittingRef.current = false;
    }
  }, [accepted, 
    // isValidMobile, 
    mobile, sendOtp, showError]);

  const handleAgree = useCallback(() => {
    setAccepted(true);
    setSheetVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.scroll}>
        <Animated.View style={[styles.top]}>
          <TerraceHeader />
        </Animated.View>

        {/* Hero — edge to edge, keeps the asset's aspect ratio */}
        <HeroImage />

        {/* Bottom card — overlaps hero with rounded top corners */}
        <Animated.View style={[styles.cardWrap, { transform: [{ translateY: shift }] }]}>
        <View style={[styles.card, { paddingBottom: insets.bottom + getHeight(20) }]}>
          <Text style={styles.cardTitle}>{TERRACE_AUTH.getStartedTitle}</Text>

          <View style={styles.separator}>
            <View style={styles.sepLine} />
            <Text style={styles.sepText}>{TERRACE_AUTH.loginOrSignUp}</Text>
            <View style={styles.sepLine} />
          </View>

          <Pressable
            style={[
              styles.inputRow,
              focused && { borderColor: TERRACE_COLORS.orange },
              !!mobileError && { borderColor: "#DC2626" },
            ]}
            onPress={() => inputRef.current?.focus()}
          >
            <View style={styles.ccWrap}>
              <Image source={images.LoginINDFlag} style={styles.flag} contentFit="contain" />
              <Text style={styles.ccText}>{TERRACE_AUTH.countryCode}</Text>
            </View>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={TERRACE_AUTH.phonePlaceholder}
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={handleMobileChange}
              maxLength={10}
              multiline={false}
              numberOfLines={1}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </Pressable>
          {mobileError ? <Text style={styles.errorText}>{mobileError}</Text> : null}

          <View style={styles.tcBox}>
            <Pressable
              onPress={() => {
                if (!accepted) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                setAccepted((a) => !a);
              }}
              hitSlop={8}
              style={[styles.checkbox, accepted && styles.checkboxOn]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: accepted }}
            >
              {accepted ? (
                <Ionicons name="checkmark" size={getWidth(16)} color="#fff" />
              ) : null}
            </Pressable>
            <Text style={styles.tcText}>
              {TERRACE_AUTH.acceptPre}
              <Text style={styles.tcLink} onPress={() => setSheetVisible(true)}>
                {TERRACE_AUTH.acceptLink}
              </Text>
              {/* {TERRACE_AUTH.acceptMid} */}
              {/* <Text style={styles.tcLink} onPress={() => setSheetVisible(true)}>
                {TERRACE_AUTH.acceptPrivacy}
              </Text> */}
              .
            </Text>
          </View>

          <ActionButton
            title={TERRACE_AUTH.continueWithPhone}
            onPress={handleContinue}
            variant="primary"
            size="lg"
            fullWidth
            disabled={isSendingOtp}
            loading={isSendingOtp}
            containerStyle={styles.continueBtn}
          />
        </View>
        </Animated.View>
      </View>

      <TermsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onAgree={handleAgree}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, overflow: "hidden", backgroundColor: TERRACE_COLORS.screenBg },
  scroll: { flex: 1 },
  top: {
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(8),
    paddingBottom: getHeight(10),
    backgroundColor: TERRACE_COLORS.screenBg,
  },
  heroWrap: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: "#EDE7DD",
  },
  cardWrap: {
    marginTop: -getHeight(28),
    flexShrink: 0,
  },
  card: {
    backgroundColor: TERRACE_COLORS.screenBg,
    borderTopLeftRadius: getWidth(32),
    borderTopRightRadius: getWidth(32),
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(22),
  },
  cardTitle: {
    fontSize: getWidth(24),
    lineHeight: getWidth(27),
    fontFamily: manropeFamily("700"),
    color: TERRACE_COLORS.textDark,
    textAlign: "center",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: getHeight(10),
  },
  sepLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "#D1D5DB" },
  sepText: {
    fontSize: getWidth(12),
    letterSpacing: 0.5,
    fontFamily: manropeFamily("600"),
    color: TERRACE_COLORS.textMuted,
    marginHorizontal: getWidth(12),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TERRACE_COLORS.screenBg,
    borderRadius: getWidth(14),
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    height: getHeight(54),
    marginTop: getHeight(20),
    overflow: "hidden",
  },
  ccWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    paddingHorizontal: getWidth(14),
    borderRightWidth: 1.5,
    borderRightColor: "#D1D5DB",
  },
  flag: { width: getWidth(30), aspectRatio: 27 / 19, marginRight: getWidth(10), borderRadius: getWidth(4) },
  ccText: {
    fontSize: getWidth(16),
    fontFamily: manropeFamily("500"),
    color: TERRACE_COLORS.textDark,
    // borderRadius: getWidth(4)
  },
  input: {
    flex: 1,
    fontSize: getWidth(16),
    color: TERRACE_COLORS.textDark,
    minWidth: 0,
    paddingHorizontal: getWidth(14),
    paddingVertical: 0,
    textAlignVertical: "center",
    height: "100%",
    fontFamily: manropeFamily("600"),
  },
  errorText: {
    color: "#DC2626",
    fontSize: getWidth(12),
    marginTop: getHeight(6),
    marginLeft: getWidth(4),
    fontFamily: manropeFamily("600"),
  },
  tcBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: getHeight(18),
    paddingHorizontal: getWidth(4),
  },
  checkbox: {
    width: getWidth(24),
    height: getWidth(24),
    borderRadius: getWidth(6),
    borderWidth: 1.5,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: getWidth(12),
    backgroundColor: "#fff",
  },
  checkboxOn: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  tcText: {
    flex: 1,
    fontSize: getWidth(13),
    lineHeight: getWidth(20),
    color: TERRACE_COLORS.textMuted,
    fontFamily: manropeFamily("500"),
  },
  tcLink: {
    color: TERRACE_COLORS.textDark,
    fontFamily: manropeFamily("700"),
    textDecorationLine: "underline",
  },
  continueBtn: {
    marginTop: getHeight(24),
    borderRadius: 999,
    paddingVertical: getHeight(15),
  },
});
