import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import TerraceHeader from "@/components/auth/TerraceHeader";
import SuccessModal from "@/components/UI/SuccessModal";
import { useSocietyStore } from "@/store/useSocietyStore";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { leaveCompletedFlow, interceptBackOnConfirmation } from "@/lib/completedFlowNavigation";
import { router, Stack, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyConfirmationScreen() {
  const societyName = useSocietyStore((s) => s.selectedSociety?.name) ?? "your society";

  const navigation = useNavigation();
  const leaving = useRef(false);

  const handleBrowse = useCallback(() => {
    leaving.current = true;
    leaveCompletedFlow(router, "/(tabs)/home");
  }, []);

  // Back (hardware / header / gesture) must not reveal the submitted steps.
  useEffect(() => {
    return navigation.addListener("beforeRemove", (e) => {
      if (interceptBackOnConfirmation(e, leaving)) handleBrowse();
    });
  }, [navigation, handleBrowse]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <TerraceHeader compact />

      {/* Registered, not verified — the copy says so; approval stays with the admins. */}
      <SuccessModal
        visible
        onClose={handleBrowse}
        title="Resident Registered Successfully!"
        subtitle={`Your request to join ${societyName} has been submitted. ${societyName} admins will review it shortly.`}
        secondaryActionLabel="Back to Home"
        secondaryCountdownMs={3000}
        onSecondaryAction={handleBrowse}
      >
        <View style={styles.trackNote}>
          <Ionicons name="person-circle-outline" size={getWidth(18)} color={TERRACE_COLORS.textMuted} />
          <Text style={styles.trackNoteText}>
            Track your verification anytime in Profile → Verification. We&apos;ll notify you once it&apos;s approved.
          </Text>
        </View>
      </SuccessModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TERRACE_COLORS.screenBg },
  trackNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: getWidth(8),
    paddingHorizontal: getWidth(8),
  },
  trackNoteText: {
    flex: 1,
    fontSize: getWidth(12.5),
    lineHeight: getHeight(18),
    color: TERRACE_COLORS.textMuted,
  },
});
