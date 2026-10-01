import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import TerraceHeader from "@/components/auth/TerraceHeader";
import ActionButton from "@/components/inputs/ActionButton";
import TerraceSelectField from "@/components/inputs/TerraceSelectField";
import TerraceTextField from "@/components/inputs/TerraceTextField";
import TerraceStepper from "@/components/onboarding/TerraceStepper";
import { useImageUploader } from "@/components/image-upload";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = ["Basic Details", "Verification", "Review"];

export default function VerifyStep1Screen() {
  const { role, mode } = useLocalSearchParams<{ role?: string; mode?: string }>();
  const isEdit = mode === "edit";
  const towerList = useSocietyStore((s) => s.towerList);
  const user = useUserStore((s) => s.user);
  const updateResidentProfile = useUserStore((s) => s.updateResidentProfile);
  const { openImageUploader } = useImageUploader();
  const [newDocUrl, setNewDocUrl] = useState<string | undefined>();
  const [docBusy, setDocBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});
  const track = (k: string) => ({ onLayout: (e: any) => { fieldY.current[k] = e.nativeEvent.layout.y; } });

  // Edit mode (from My Profiles → Manage Your Resident Account) prefills from
  // the current user; create mode starts empty as before.
  const [fullName, setFullName] = useState(isEdit ? user?.fullName ?? "" : "");
  const [email, setEmail] = useState(isEdit ? user?.email ?? "" : "");
  const [towerId, setTowerId] = useState<string | null>(isEdit ? ((user?.tower as string) ?? null) : null);
  const [flatNo, setFlatNo] = useState<string | null>(isEdit ? ((user?.flatNo as string) ?? null) : null);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; tower?: boolean; flatNo?: boolean }>({});

  const towerOptions = useMemo(
    () => towerList.map((t) => ({ id: t._id, name: t.name })),
    [towerList],
  );

  const replaceDocument = useCallback(async () => {
    setDocBusy(true);
    try {
      const res = await openImageUploader({
        title: "Residence Proof",
        aspectRatios: ["4:5", "1:1", "16:9"],
        defaultAspectRatio: "4:5",
        quality: 0.85,
      });
      if (res && "uri" in res && res.url) setNewDocUrl(res.url);
    } finally {
      setDocBusy(false);
    }
  }, [openImageUploader]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const handleContinue = useCallback(async () => {
    const nextErrors: typeof errors = {};
    if (!fullName.trim()) nextErrors.fullName = "Full name is required";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address";
    }
    if (!isEdit && !towerId) nextErrors.tower = true;
    if (!isEdit && !flatNo) nextErrors.flatNo = true;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      // Scroll to the first invalid field (visual order).
      const first = (["fullName", "email", "tower", "flatNo"] as const).find((k) => nextErrors[k]);
      if (first) scrollRef.current?.scrollTo({ y: Math.max(0, (fieldY.current[first] ?? 0) - 16), animated: true });
      return;
    }

    if (isEdit) {
      // Existing resident: update details via the same updateUser call the
      // previous manage sheet used; no new verification submission.
      if (!user?._id || saving) return;
      setSaving(true);
      try {
        await updateResidentProfile({
          full_name: fullName.trim(),
          email: email.trim() || undefined,
          document_url: newDocUrl,
        });
        if (router.canGoBack()) router.back();
      } catch (e) {
        console.error("[VerifyStep1] Resident update failed:", e);
      } finally {
        setSaving(false);
      }
      return;
    }

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
  }, [fullName, email, towerId, flatNo, role, isEdit, user?._id, saving, updateResidentProfile, newDocUrl]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TerraceHeader compact onBack={goBack} />

        {isEdit ? null : <TerraceStepper steps={STEPS} currentStep={1} />}

        <Text style={styles.title}>Let&apos;s start with some basics</Text>
        <Text style={styles.subtitle}>Add a few details about yourself.</Text>

        <View {...track("fullName")}>
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
        </View>

        <View {...track("email")}>
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
        </View>

        {isEdit ? (
          <>
            <TerraceTextField
              label="Tower / Block"
              leftIcon="lock-closed-outline"
              value={towerOptions.find((o) => o.id === towerId)?.name ?? towerId ?? ""}
              editable={false}
            />
            <TerraceTextField
              label="Flat / Unit Number"
              leftIcon="lock-closed-outline"
              value={flatNo ?? ""}
              editable={false}
            />
            <ActionButton
              title={newDocUrl ? "New document selected — tap to change" : "Replace verification document"}
              onPress={replaceDocument}
              variant="secondary"
              size="lg"
              fullWidth
              disabled={docBusy}
            />
          </>
        ) : (
          <>
            <View {...track("tower")}>
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
              {errors.tower ? <Text style={styles.fieldErr}>Select your tower / block</Text> : null}
            </View>
            <View {...track("flatNo")}>
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
            </View>
          </>
        )}

        <Text style={styles.helperNote}>
          This helps us verify you as a resident of this society.
        </Text>

        <ActionButton
          title={isEdit ? "Save Changes" : "Continue"}
          onPress={handleContinue}
          disabled={saving || docBusy}
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
  fieldErr: { marginTop: -getHeight(10), marginBottom: getHeight(14), fontSize: getWidth(12.5), color: "#DC2626" },
  safe: { flex: 1, backgroundColor: TERRACE_COLORS.screenBg },
  scroll: {
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(12),
    paddingBottom: getHeight(24),
  },
  title: {
    fontSize: getWidth(24),
    fontFamily: "Manrope_700Bold",
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
    borderRadius: getWidth(14),
    paddingVertical: getHeight(15),
  },
  footerText: {
    fontSize: getWidth(12),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(14),
  },
});
