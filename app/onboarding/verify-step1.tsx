import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import TerraceHeader from "@/components/auth/TerraceHeader";
import ActionButton from "@/components/inputs/ActionButton";
import TerraceSelectField from "@/components/inputs/TerraceSelectField";
import TerraceTextField from "@/components/inputs/TerraceTextField";
import TerraceStepper from "@/components/onboarding/TerraceStepper";
import { useSocietyStore } from "@/store/useSocietyStore";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = ["Basic Details", "Verification", "Review"];

export default function VerifyStep1Screen() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const towerList = useSocietyStore((s) => s.towerList);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [towerId, setTowerId] = useState<string | null>(null);
  const [flatNo, setFlatNo] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; tower?: boolean; flatNo?: boolean }>({});

  const towerOptions = useMemo(
    () => towerList.map((t) => ({ id: t._id, name: t.name })),
    [towerList],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handleContinue = useCallback(() => {
    const nextErrors: typeof errors = {};
    if (!fullName.trim()) nextErrors.fullName = "Full name is required";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address";
    }
    if (!towerId) nextErrors.tower = true;
    if (!flatNo) nextErrors.flatNo = true;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    router.push({
      pathname: "/onboarding/verify-step2",
      params: {
        role: role ?? "resident",
        fullName: fullName.trim(),
        email: email.trim(),
        towerId: towerId ?? "",
        flatNo: flatNo ?? "",
      },
    });
  }, [fullName, email, towerId, flatNo, role]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TerraceHeader compact onBack={goBack} />

        <TerraceStepper steps={STEPS} currentStep={1} />

        <Text style={styles.title}>Let&apos;s start with some basics</Text>
        <Text style={styles.subtitle}>Add a few details about yourself.</Text>

        <TerraceTextField
          label="Full Name"
          placeholder="Enter your full name"
          leftIcon="person-outline"
          value={fullName}
          onChangeText={(v) => {
            setFullName(v);
            setErrors((e) => ({ ...e, fullName: undefined }));
          }}
          error={errors.fullName}
        />

        <TerraceTextField
          label="Email Address"
          optionalLabel
          placeholder="Enter your email address"
          leftIcon="mail-outline"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setErrors((e) => ({ ...e, email: undefined }));
          }}
          error={errors.email}
          helperText={!errors.email ? "Used for important updates and notifications." : undefined}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TerraceSelectField
          label="Tower / Block"
          placeholder="Select tower"
          leftIcon="business-outline"
          options={towerOptions}
          selectedId={towerId}
          onChange={(id) => {
            setTowerId(id);
            setFlatNo(null);
            setErrors((e) => ({ ...e, tower: false }));
          }}
          modalTitle="Select tower / block"
          error={errors.tower}
        />

        <TerraceTextField
          label="Flat / Unit Number"
          placeholder={towerId ? "Enter flat number, e.g. 101" : "Select a tower first"}
          leftIcon="home-outline"
          value={flatNo ?? ""}
          onChangeText={(v) => {
            setFlatNo(v.replace(/[^0-9]/g, ""));
            setErrors((e) => ({ ...e, flatNo: false }));
          }}
          error={errors.flatNo ? "Flat number is required" : undefined}
          keyboardType="numeric"
          editable={!!towerId}
        />

        <Text style={styles.helperNote}>
          This helps us verify you as a resident of this society.
        </Text>

        <ActionButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
          rightIcon={<Ionicons name="arrow-forward" size={getWidth(18)} color="#fff" />}
          containerStyle={styles.continueBtn}
        />

        <Text style={styles.footerText}>We only use this information for verification.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TERRACE_COLORS.screenBg },
  scroll: {
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(12),
    paddingBottom: getHeight(24),
  },
  title: {
    fontSize: getWidth(24),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
    textAlign: "center",
    marginTop: getHeight(24),
  },
  subtitle: {
    fontSize: getWidth(14),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(6),
    marginBottom: getHeight(24),
  },
  helperNote: {
    fontSize: getWidth(12.5),
    color: TERRACE_COLORS.textMuted,
    marginTop: -getHeight(6),
    marginBottom: getHeight(20),
  },
  continueBtn: {
    borderRadius: getWidth(28),
    paddingVertical: getHeight(15),
  },
  footerText: {
    fontSize: getWidth(12),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(14),
  },
});
