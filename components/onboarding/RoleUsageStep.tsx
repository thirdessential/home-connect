import ActionButton from "@/components/inputs/ActionButton";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type UsageRole = "resident" | "business" | "both";

const OPTIONS: {
  id: UsageRole;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "resident", title: "As a Resident", icon: "home-outline" },
  { id: "business", title: "As a Business", icon: "storefront-outline" },
  { id: "both", title: "Both Resident & Business", icon: "layers-outline" },
];

type Props = {
  selected: UsageRole | null;
  onSelect: (role: UsageRole) => void;
  onContinue: () => void;
};

function RoleUsageStep({ selected, onSelect, onContinue }: Props) {
  const t = useTheme();

  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            activeOpacity={0.85}
            style={[
              styles.card,
              {
                borderColor: isSelected ? t.colors.primary : t.colors.border,
                backgroundColor: isSelected
                  ? t.colors.primary + "10"
                  : t.colors.surface,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: t.colors.primary + "15" },
              ]}
            >
              <Ionicons name={opt.icon} size={22} color={t.colors.primary} />
            </View>
            <Text style={[styles.title, { color: t.colors.textPrimary }]}>
              {opt.title}
            </Text>
            <View
              style={[
                styles.radio,
                { borderColor: isSelected ? t.colors.primary : t.colors.border },
              ]}
            >
              {isSelected && (
                <View style={[styles.radioDot, { backgroundColor: t.colors.primary }]} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.footerNote}>
        <Ionicons name="lock-closed-outline" size={14} color={t.colors.textSecondary} />
        <Text style={[styles.footerNoteText, { color: t.colors.textSecondary }]}>
          Your information is secure and used only for verification.
        </Text>
      </View>

      <ActionButton
        title="Continue"
        onPress={onContinue}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selected}
        containerStyle={{ marginTop: 8 }}
      />
    </View>
  );
}

export default memo(RoleUsageStep);

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  footerNoteText: {
    fontSize: 12,
  },
});
