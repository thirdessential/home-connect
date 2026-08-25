import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Label from "./Label";

export type SelectOption = { id: string; name: string; icon?: keyof typeof Ionicons.glyphMap };

type Props = {
  label?: string;
  required?: boolean;
  options: SelectOption[];
  selectedId: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  error?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Global Select/Dropdown primitive for post-login forms — bottom-sheet style
// picker with consistent height/border/radius. Custom `style` overrides only
// the trigger container.
const Select = memo(function Select({
  label,
  required,
  options,
  selectedId,
  onChange,
  placeholder = "Select…",
  leftIcon,
  error,
  disabled,
  style,
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === selectedId);

  return (
    <View style={{ marginBottom: t.spacing.l }}>
      {label ? <Label required={required}>{label}</Label> : null}
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            height: 52,
            paddingHorizontal: t.spacing.m,
            borderRadius: t.radii.medium,
            borderWidth: 1.5,
            borderColor: error ? t.colors.error : t.colors.border,
            backgroundColor: disabled ? t.colors.surfaceAlt : t.colors.cardBackground,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        {(selected?.icon || leftIcon) ? (
          <Ionicons
            name={selected?.icon ?? leftIcon}
            size={18}
            color={t.colors.secondaryText}
            style={{ marginRight: t.spacing.s }}
          />
        ) : null}
        <Text
          style={[
            t.typography.body,
            { flex: 1, color: selected ? t.colors.text : t.colors.secondaryText },
          ]}
          numberOfLines={1}
        >
          {selected?.name ?? placeholder}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={t.colors.secondaryText} />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setOpen(false)}>
          <View
            style={{
              backgroundColor: t.colors.cardBackground,
              borderTopLeftRadius: t.radii.large,
              borderTopRightRadius: t.radii.large,
              paddingTop: t.spacing.m,
              paddingBottom: insets.bottom + t.spacing.m,
              maxHeight: "70%",
            }}
          >
            <Text style={[t.typography.h4, { color: t.colors.text, paddingHorizontal: t.spacing.l, marginBottom: t.spacing.s }]}>
              {label ?? "Select"}
            </Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.id}
              contentContainerStyle={{ paddingBottom: t.spacing.l }}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: t.spacing.m,
                      paddingHorizontal: t.spacing.l,
                      backgroundColor: isSelected ? t.colors.brandWeak : "transparent",
                    }}
                  >
                    {item.icon ? (
                      <Ionicons name={item.icon} size={18} color={isSelected ? t.colors.brandDark : t.colors.secondaryText} style={{ marginRight: t.spacing.s }} />
                    ) : null}
                    <Text style={[t.typography.body, { flex: 1, color: isSelected ? t.colors.brandDark : t.colors.text, fontWeight: isSelected ? "700" : "400" }]}>
                      {item.name}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark" size={18} color={t.colors.brandDark} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
});

export default Select;
