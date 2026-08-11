import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

export type HomeFeedFilter = "all" | "updates" | "photos" | "polls" | "deals" | "events";

const CHIPS: { key: HomeFeedFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "all", label: "All Posts", icon: "grid" },
  { key: "updates", label: "Updates", icon: "megaphone-outline" },
  { key: "photos", label: "Photos", icon: "image-outline" },
  { key: "polls", label: "Polls", icon: "bar-chart-outline" },
  { key: "deals", label: "Deals", icon: "pricetag-outline" },
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
            style={[
              styles.chip,
              isSelected
                ? { backgroundColor: "#15803D" }
                : { backgroundColor: t.colors.surfaceAlt },
            ]}
          >
            <Ionicons
              name={chip.icon}
              size={14}
              color={isSelected ? "#fff" : t.colors.textSecondary}
              style={styles.chipIcon}
            />
            <Text
              style={[
                styles.chipLabel,
                { color: isSelected ? "#fff" : t.colors.textSecondary },
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
    gap: 8,
    paddingVertical: 4,
    paddingBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
