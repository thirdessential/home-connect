import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Option = { id: string; name: string };

type Props = {
  label: string;
  options: Option[];
  selectedId: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  modalTitle?: string;
  error?: boolean;
  disabled?: boolean;
};

/**
 * Terrace-styled select field: label above, icon-in-row trigger with a
 * rounded outline border, opening a simple bottom sheet list. Cloned from
 * components/form/dropdown.tsx and restyled to match the onboarding/
 * verification screens — kept separate so the original SelectField (used
 * elsewhere) is untouched.
 */
function TerraceSelectField({
  label,
  options,
  selectedId,
  onChange,
  placeholder = "Select…",
  leftIcon,
  modalTitle = "Select an option",
  error = false,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((o) => o.id === selectedId)?.name,
    [options, selectedId],
  );

  return (
    <View style={[styles.container, disabled && { opacity: 0.5 }]}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.8}
        style={[styles.inputRow, error && { borderColor: "#DC2626" }]}
        disabled={disabled}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={getWidth(18)}
            color={TERRACE_COLORS.textMuted}
            style={styles.icon}
          />
        ) : null}
        <Text
          numberOfLines={1}
          style={[
            styles.value,
            !selected && { color: "#9CA3AF" },
          ]}
        >
          {selected ?? placeholder}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={getWidth(18)}
          color={TERRACE_COLORS.textMuted}
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          style={styles.overlay}
        >
          <SafeAreaView style={styles.sheet} edges={["bottom"]}>
            <Text style={styles.sheetTitle}>{modalTitle}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.id}
              ItemSeparatorComponent={() => <View style={{ height: getHeight(8) }} />}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                    style={[
                      styles.optionRow,
                      isSelected && { borderColor: TERRACE_COLORS.orange, backgroundColor: TERRACE_COLORS.orangeTint },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && { color: TERRACE_COLORS.orange, fontWeight: "700" },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={getWidth(18)} color={TERRACE_COLORS.orange} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: getHeight(28) }}
              style={{ maxHeight: getHeight(360) }}
            />
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default memo(TerraceSelectField);

const styles = StyleSheet.create({
  container: {
    marginBottom: getHeight(18),
  },
  label: {
    fontSize: getWidth(14),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
    marginBottom: getHeight(8),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TERRACE_COLORS.screenBg,
    borderRadius: getWidth(14),
    borderWidth: 1.5,
    borderColor: TERRACE_COLORS.inputBorder,
    height: getHeight(54),
    paddingHorizontal: getWidth(14),
  },
  icon: {
    marginRight: getWidth(10),
  },
  value: {
    flex: 1,
    fontSize: getWidth(16),
    color: TERRACE_COLORS.textDark,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: TERRACE_COLORS.screenBg,
    borderTopLeftRadius: getWidth(20),
    borderTopRightRadius: getWidth(20),
    paddingHorizontal: getWidth(20),
    paddingTop: getHeight(18),
    maxHeight: "70%",
  },
  sheetTitle: {
    fontSize: getWidth(17),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
    marginBottom: getHeight(14),
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: getHeight(14),
    paddingHorizontal: getWidth(14),
    borderRadius: getWidth(12),
    borderWidth: 1.5,
    borderColor: TERRACE_COLORS.inputBorder,
  },
  optionText: {
    fontSize: getWidth(15),
    color: TERRACE_COLORS.textDark,
    fontWeight: "500",
  },
});
