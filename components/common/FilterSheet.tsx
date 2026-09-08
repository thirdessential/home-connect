import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export type FilterField = {
  key: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
};

type Props = {
  visible: boolean;
  title: string;
  fields: FilterField[];
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
};

/** Reusable filter popup — centered modal on wide screens, bottom-sheet on
 * mobile, matching the reference design's two layouts for one component. */
export default function FilterSheet({ visible, title, fields, onApply, onClear, onClose }: Props) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const centered = width >= 700;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(20,20,10,0.42)",
          justifyContent: centered ? "center" : "flex-end",
          alignItems: centered ? "center" : "stretch",
          padding: centered ? 20 : 0,
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: t.colors.surface,
            width: centered ? "100%" : undefined,
            maxWidth: centered ? 460 : undefined,
            borderRadius: centered ? t.radii.large : undefined,
            borderTopLeftRadius: t.radii.large,
            borderTopRightRadius: t.radii.large,
            padding: 20,
            maxHeight: "85%",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: t.colors.textPrimary }}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={t.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {fields.map((f) => (
              <View key={f.key} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12.5, fontWeight: "600", color: t.colors.textSecondary, marginBottom: 8 }}>
                  {f.label}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {f.options.map((opt) => {
                    const active = f.value === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => f.onChange(opt.value)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? t.colors.brand : t.colors.border,
                          backgroundColor: active ? t.colors.brandWeak : t.colors.surface,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: "600", color: active ? t.colors.brandDark : t.colors.textSecondary }}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <TouchableOpacity
              onPress={onClear}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: t.colors.border,
              }}
            >
              <Text style={{ fontWeight: "700", color: t.colors.textPrimary }}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onApply}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: t.colors.brand,
              }}
            >
              <Text style={{ fontWeight: "700", color: "#fff" }}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
