import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

export type HomeFeedFilter = "all" | "updates" | "photos" | "polls" | "events";

const CHIPS: { key: HomeFeedFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "all", label: "All Posts", icon: "grid" },
  { key: "updates", label: "Updates", icon: "megaphone-outline" },
  { key: "photos", label: "Photos", icon: "image-outline" },
  { key: "polls", label: "Polls", icon: "bar-chart-outline" },
  { key: "events", label: "Events", icon: "calendar-outline" },
];

type Props = {
  selected: HomeFeedFilter;
  onSelect: (key: HomeFeedFilter) => void;
};

function HomeFilterChips({ selected, onSelect }: Props) {
  const t = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CHIPS.map((chip) => {
        const isSelected = chip.key === selected;
        return (
          <TouchableOpacity
            key={chip.key}
            onPress={() => onSelect(chip.key)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? t.colors.brand : t.colors.surface,
                borderColor: isSelected ? t.colors.brand : t.colors.border,
              },
            ]}
          >
            <Ionicons
              name={chip.icon}
              size={14}
              color={isSelected ? t.colors.onBrand : t.colors.textSecondary}
              style={styles.chipIcon}
            />
            <Text
              style={[
                styles.chipLabel,
                { color: isSelected ? t.colors.onBrand : t.colors.textPrimary },
              ]}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default memo(HomeFilterChips);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
    paddingBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    // Matches the reference's soft chip shadow.
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
