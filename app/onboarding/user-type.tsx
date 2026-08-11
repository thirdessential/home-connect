import {
  TERRACE_AUTH,
  TERRACE_COLORS,
  USER_TYPE_SCREEN,
} from "@/assets/constants/auth.constant";
import TerraceHeader from "@/components/auth/TerraceHeader";
import { useToast } from "@/components/common/Toast";
import ActionButton from "@/components/inputs/ActionButton";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Option = (typeof USER_TYPE_SCREEN.options)[number];

function OptionCard({
  item,
  selected,
  onPress,
}: {
  item: Option;
  selected: boolean;
  onPress: (item: Option) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={[
        styles.card,
        selected && styles.cardSelected,
        !item.enabled && styles.cardDisabled,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !item.enabled }}
    >
      <View style={[styles.cardIcon, { backgroundColor: item.tint }]}>
        <Ionicons name={item.icon as any} size={getWidth(26)} color={item.color} />
      </View>
      <Text style={styles.cardLabel}>{item.label}</Text>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

export default function UserTypeScreen() {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<string>("resident");

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login");
  }, []);

  const handleSelect = useCallback(
    (item: Option) => {
      if (!item.enabled) {
        showToast(USER_TYPE_SCREEN.comingSoonToast, "info");
        return;
      }
      setSelected(item.key);
    },
    [showToast],
  );

  const handleContinue = useCallback(() => {
    // Only the Resident flow is active in the current scope.
    console.log("[Terrace] Onboarding complete as:", selected);
    router.replace("/(tabs)/home");
  }, [selected]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <TerraceHeader compact onBack={goBack} />

        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={getWidth(26)} color="#fff" />
        </View>

        <Text style={styles.title}>{USER_TYPE_SCREEN.title}</Text>
        <Text style={styles.subtitle}>{USER_TYPE_SCREEN.subtitle}</Text>

        <View style={styles.options}>
          {USER_TYPE_SCREEN.options.map((item) => (
            <OptionCard
              key={item.key}
              item={item}
              selected={selected === item.key}
              onPress={handleSelect}
            />
          ))}
        </View>

        <View style={styles.secureRow}>
          <View style={styles.lockCircle}>
            <Ionicons
              name="lock-closed"
              size={getWidth(15)}
              color={TERRACE_COLORS.textMuted}
            />
          </View>
          <Text style={styles.secureText}>{USER_TYPE_SCREEN.secureNote}</Text>
        </View>

        <View style={styles.spacer} />

        <ActionButton
          title={USER_TYPE_SCREEN.continue}
          onPress={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
          containerStyle={styles.continueBtn}
        />

        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={getWidth(16)}
            color={TERRACE_COLORS.textMuted}
          />
          <Text style={styles.footerText}>{TERRACE_AUTH.safeFooter}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TERRACE_COLORS.screenBg,
  },
  container: {
    flex: 1,
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(8),
  },
  badge: {
    width: getWidth(60),
    height: getWidth(60),
    borderRadius: getWidth(30),
    backgroundColor: TERRACE_COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: getHeight(24),
    shadowColor: TERRACE_COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: getWidth(26),
    fontWeight: "800",
    color: TERRACE_COLORS.textDark,
    textAlign: "center",
    marginTop: getHeight(16),
  },
  subtitle: {
    fontSize: getWidth(14),
    lineHeight: getHeight(21),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(10),
    paddingHorizontal: getWidth(12),
  },
  options: {
    marginTop: getHeight(24),
    gap: getHeight(14),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: getWidth(16),
    borderWidth: 1.5,
    borderColor: TERRACE_COLORS.inputBorder,
    paddingVertical: getHeight(14),
    paddingHorizontal: getWidth(16),
  },
  cardSelected: {
    borderColor: TERRACE_COLORS.orange,
    backgroundColor: "#FFFDFB",
  },
  cardDisabled: {
    opacity: 0.7,
  },
  cardIcon: {
    width: getWidth(52),
    height: getWidth(52),
    borderRadius: getWidth(26),
    alignItems: "center",
    justifyContent: "center",
    marginRight: getWidth(14),
  },
  cardLabel: {
    flex: 1,
    fontSize: getWidth(16),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
  },
  radio: {
    width: getWidth(24),
    height: getWidth(24),
    borderRadius: getWidth(12),
    borderWidth: 2,
    borderColor: "#C7C1B6",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: TERRACE_COLORS.orange,
  },
  radioDot: {
    width: getWidth(12),
    height: getWidth(12),
    borderRadius: getWidth(6),
    backgroundColor: TERRACE_COLORS.orange,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: getHeight(20),
    paddingHorizontal: getWidth(4),
  },
  lockCircle: {
    width: getWidth(34),
    height: getWidth(34),
    borderRadius: getWidth(17),
    backgroundColor: "#EEF0EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: getWidth(12),
  },
  secureText: {
    flex: 1,
    fontSize: getWidth(13),
    lineHeight: getHeight(19),
    color: TERRACE_COLORS.textMuted,
  },
  spacer: {
    flex: 1,
  },
  continueBtn: {
    borderRadius: getWidth(28),
    paddingVertical: getHeight(16),
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: getHeight(14),
    marginBottom: getHeight(6),
  },
  footerText: {
    fontSize: getWidth(13),
    color: TERRACE_COLORS.textMuted,
    marginLeft: getWidth(8),
  },
});
