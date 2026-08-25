import { FilterChipsProps } from "@/types/common.type";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function FilterChips({
  options,
  initialValue,
  onChange,
  style,
  all,
  horizontal,
}: FilterChipsProps & { all?: boolean; horizontal?: boolean }) {
  // If 'all' is passed, add an 'All' chip at the start
  const allChip = all
    ? [{ id: "all", name: typeof all === "string" ? all : "All" }]
    : [];
  const chips = [...allChip, ...options];

  const [selected, setSelected] = useState(initialValue ?? chips[0]?.id ?? "");

  const handleSelect = (value: string) => {
    setSelected(value);
    onChange(value);
  };

  const ChipRow = (
    <View
      style={[
        { flexDirection: "row", alignItems: "center", gap: 8 },
        horizontal ? {} : { flexWrap: "wrap" },
      ]}
    >
      {chips.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: selected === opt.id ? "#15803D" : "#F3F4F6",
            backgroundColor: selected === opt.id ? "#FFF7ED" : "#F3F4F6",
          }}
          onPress={() => handleSelect(opt.id)}
        >
          <Text
            style={{
              color: selected === opt.id ? "#15803D" : "#374151",
              fontSize: 14,
              fontWeight: "500",
              lineHeight: 21,
            }}
          >
            {opt.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[{ paddingBottom: 8 }, style]}
      >
        {ChipRow}
      </ScrollView>
    );
  }

  return <View style={[{ paddingHorizontal: 16 }, style]}>{ChipRow}</View>;
}
