import {
  TERRACE_AUTH,
  TERRACE_COLORS,
  TERRACE_FEATURES,
} from "@/assets/constants/auth.constant";
import { images } from "@/assets/images";
import TermsSheet from "@/components/auth/TermsSheet";
import TerraceHeader from "@/components/auth/TerraceHeader";
import { useToast } from "@/components/common/Toast";
import ActionButton from "@/components/inputs/ActionButton";
import { useAuthStore } from "@/store/useAuthStore";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

function FeatureColumn({ item }: { item: (typeof TERRACE_FEATURES)[number] }) {
  return (
    <View style={styles.feature}>
      <View style={[styles.featureIcon, { backgroundColor: item.tint }]}>
        {item.lib === "mci" ? (
          <MaterialCommunityIcons
            name={item.icon as any}
            size={getWidth(24)}
            color={item.color}
          />
        ) : (
          <Ionicons name={item.icon as any} size={getWidth(24)} color={item.color} />
        )}
      </View>
      <Text style={[styles.featureTitle, { color: item.color }]}>{item.title}</Text>
      <Text style={styles.featureDesc}>{item.desc}</Text>
    </View>
  );
}

export default function LoginScreen() {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const isSendingOtp = useAuthStore((s) => s.isSendingOtp);

  const [mobile, setMobile] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const submittingRef = useRef(false);

  const isValidMobile = mobile.length === 10;
  const canContinue = useMemo(
    () => isValidMobile && accepted,
    [isValidMobile, accepted],
  );

  const handleMobileChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    setMobile(cleaned);
    setMobileError(null);
    if (cleaned.length === 10) Keyboard.dismiss();
  }, []);

  const handleContinue = useCallback(async () => {
    if (submittingRef.current) return;
    Keyboard.dismiss();
    if (!isValidMobile) {
      setMobileError(TERRACE_AUTH.invalidMobile);
      showToast(TERRACE_AUTH.invalidMobile, "error");
      return;
    }
    if (!accepted) {
      showToast(TERRACE_AUTH.checkTerms, "info");
      return;
    }

    submittingRef.current = true;
    try {
      await sendOtp(mobile);
      router.push({ pathname: "/(auth)/verify-otp", params: { phone: mobile } });
    } catch (err: any) {
      const message =
        err?.message || TERRACE_AUTH.otpSendFailed || "Failed to send OTP. Please try again.";
      showToast(message, "error");
    } finally {
      submittingRef.current = false;
    }
  }, [accepted, isValidMobile, mobile, sendOtp, showToast]);

  const handleAgree = useCallback(() => {
    setAccepted(true);
    setSheetVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={getHeight(20)}
        bounces={false}
      >
        {/* Branding + marketing (padded) */}
        <View style={styles.top}>
          <TerraceHeader />

          <Text style={styles.headline}>
            {TERRACE_AUTH.headlinePre}
            <Text style={styles.headlineAccent}>{TERRACE_AUTH.headlineAccent}</Text>
          </Text>

          <View style={styles.featureRow}>
            {TERRACE_FEATURES.map((item, i) => (
              <React.Fragment key={item.key}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <FeatureColumn item={item} />
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Hero — edge to edge */}
        <Image
          source={images.LoginBgimage}
          style={styles.hero}
          contentFit="cover"
          transition={200}
        />

        {/* Bottom card — edge to edge */}
        <View style={[styles.card, { paddingBottom: insets.bottom + getHeight(14) }]}>
          <Text style={styles.cardTitle}>{TERRACE_AUTH.getStartedTitle}</Text>
          <Text style={styles.cardSubtitle}>{TERRACE_AUTH.getStartedSubtitle}</Text>

          <Pressable
            style={[
              styles.inputRow,
              focused && { borderColor: TERRACE_COLORS.orange },
              !!mobileError && { borderColor: "#DC2626" },
            ]}
            onPress={() => inputRef.current?.focus()}
          >
            <View style={styles.ccWrap}>
              <Text style={styles.flag}>{TERRACE_AUTH.countryFlag}</Text>
              <Text style={styles.ccText}>{TERRACE_AUTH.countryCode}</Text>
              <Ionicons
                name="chevron-down"
                size={getWidth(16)}
                color={TERRACE_COLORS.textMuted}
              />
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
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </Pressable>
          {mobileError ? <Text style={styles.errorText}>{mobileError}</Text> : null}

          <ActionButton
            title={TERRACE_AUTH.continueWithPhone}
            onPress={handleContinue}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canContinue || isSendingOtp}
            loading={isSendingOtp}
            leftIcon={
              <Ionicons
                name="call"
                size={getWidth(18)}
                color={canContinue ? "#fff" : "#9CA3AF"}
              />
            }
            containerStyle={styles.continueBtn}
          />

          <View style={styles.tcBox}>
            <Pressable
              onPress={() => setAccepted((a) => !a)}
              hitSlop={8}
              style={[
                styles.checkbox,
                accepted && {
                  backgroundColor: TERRACE_COLORS.orange,
                  borderColor: TERRACE_COLORS.orange,
                },
              ]}
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
            </Text>
          </View>

          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={getWidth(16)}
              color={TERRACE_COLORS.textMuted}
            />
            <Text style={styles.footerText}>{TERRACE_AUTH.safeFooter}</Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <TermsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onAgree={handleAgree}
      />
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
  },
  top: {
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(8),
  },
  headline: {
    fontSize: getWidth(27),
    lineHeight: getHeight(34),
    fontWeight: "600",
    color: TERRACE_COLORS.textDark,
    textAlign: "center",
    // marginTop: getHeight(16),
  },
  headlineAccent: {
    color: TERRACE_COLORS.orange,
    fontWeight: "600",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: getHeight(18),
  },
  feature: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: getWidth(6),
  },
  featureIcon: {
    width: getWidth(52),
    height: getWidth(52),
    borderRadius: getWidth(26),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: getHeight(5),
  },
  featureTitle: {
    fontSize: getWidth(15),
    fontWeight: "600",
    // marginBottom: getHeight(5),
  },
  featureDesc: {
    fontSize: getWidth(11),
    lineHeight: getHeight(15),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: TERRACE_COLORS.inputBorder,
    // marginTop: getHeight(4),
  },
  hero: {
    flex: 1,
    minHeight: getHeight(200),
    width: "100%",
    marginTop: getHeight(0),
    backgroundColor: "#EDE7DD",
  },
  card: {
    backgroundColor: TERRACE_COLORS.screenBg,
    borderTopLeftRadius: getWidth(14),
    borderTopRightRadius: getWidth(14),
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(18),
    marginTop: -getHeight(16),
    marginHorizontal: getHeight(15),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTitle: {
    fontSize: getWidth(22),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
  },
  cardSubtitle: {
    fontSize: getWidth(14),
    fontWeight: "400",
    color: TERRACE_COLORS.textMuted,
    marginTop: getHeight(4),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TERRACE_COLORS.screenBg,
    borderRadius: getWidth(14),
    borderWidth: 1.5,
    borderColor: TERRACE_COLORS.inputBorder,
    height: getHeight(54),
    marginTop: getHeight(16),
    overflow: "hidden",
  },
  ccWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    paddingHorizontal: getWidth(12),
    borderRightWidth: 1.5,
    borderRightColor: TERRACE_COLORS.inputBorder,
  },
  flag: {
    fontSize: getWidth(18),
    marginRight: getWidth(6),
  },
  ccText: {
    fontSize: getWidth(16),
    fontWeight: "600",
    color: TERRACE_COLORS.textDark,
    marginRight: getWidth(4),
  },
  input: {
    flex: 1,
    fontSize: getWidth(16),
    color: TERRACE_COLORS.textDark,
    paddingHorizontal: getWidth(14),
    height: "100%",
  },
  errorText: {
    color: "#DC2626",
    fontSize: getWidth(12),
    marginTop: getHeight(6),
    marginLeft: getWidth(4),
  },
  continueBtn: {
    marginTop: getHeight(16),
    borderRadius: getWidth(28),
    paddingVertical: getHeight(15),
  },
  tcBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: getHeight(14),
  },
  checkbox: {
    width: getWidth(22),
    height: getWidth(22),
    borderRadius: getWidth(6),
    borderWidth: 1.5,
    borderColor: "#C7C1B6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: getWidth(10),
    backgroundColor: "#fff",
  },
  tcText: {
    fontSize: getWidth(14),
    color: TERRACE_COLORS.textDark,
    fontWeight: "500",
  },
  tcLink: {
    color: TERRACE_COLORS.orange,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: getHeight(14),
  },
  footerText: {
    fontSize: getWidth(13),
    fontWeight: "400",
    color: TERRACE_COLORS.textMuted,
    marginLeft: getWidth(8),
  },
});
