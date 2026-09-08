import Heading from "@/components/UI/Heading";
import SuccessModal from "@/components/UI/SuccessModal";
import PollForm from "@/components/form/PollForm";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { BusinessCategory } from "@/types/business.type";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreatePollScreen() {
  const t = useTheme();
  const [successVisible, setSuccessVisible] = useState(false);

  const createFeed = useFeedsStore((s) => s.createFeed);
  const loading = useFeedsStore((s) => s.loading);
  const error = useFeedsStore((s) => s.error);
  const currentUser = useUserStore((s) => s.user);
  const userId = useUserStore((s) => s.user?._id);
  const societyId = useSocietyStore((s) => s.selectedSociety?._id);

  const goBack = () => router.back();
  // Success must land on Home with Create/Poll fully removed from history —
  // dismissTo pops every screen above "home" in one deterministic call.
  const goHome = () => router.dismissTo("/(tabs)/home");

  const onPollSubmit = async (pollFormData: { question: string; options: BusinessCategory[] }) => {
    const postBody = {
      type: "poll" as const,
      title: pollFormData.question,
      options: pollFormData.options,
      user: userId,
      society: societyId,
      flatNo: currentUser?.flatNo,
      towerName:
        typeof currentUser?.societyId === "object" && currentUser?.societyId !== null
          ? currentUser.societyId.name
          : undefined,
    };
    await createFeed(postBody);
    if (!useFeedsStore.getState().error) {
      setSuccessVisible(true);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.white }]} edges={["top", "bottom"]}>
      <View style={styles.headerRow}>
        <Pressable onPress={goBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={t.colors.text} />
        </Pressable>
        <Heading level={3}>Create Poll</Heading>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <PollForm onSubmit={onPollSubmit} loading={loading} error={error} />
      </View>

      <SuccessModal
        visible={successVisible}
        onClose={goHome}
        title="Poll created successfully"
        subtitle="Your poll has been created."
        primaryActionLabel="View Poll"
        onPrimaryAction={goHome}
        centered
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  body: { flex: 1, paddingHorizontal: 20 },
});
