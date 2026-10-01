import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  Platform,
  useWindowDimensions,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  /** Adds a search box above the list (opt-in; other selects unchanged). */
  searchable?: boolean;
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
  searchable = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [kbHeight, setKbHeight] = useState(0);
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Track the keyboard so the sheet lifts above it and its list height shrinks
  // to what is actually visible (Modal windows don't resize on Android).
  useEffect(() => {
    if (!open) { setKbHeight(0); return; }
    const showEv = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEv = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const a = Keyboard.addListener(showEv, (e) => setKbHeight(e.endCoordinates?.height ?? 0));
    const b = Keyboard.addListener(hideEv, () => setKbHeight(0));
    return () => { a.remove(); b.remove(); };
  }, [open]);

  // Bottom gap = keyboard (which already covers the nav bar) or the safe-area inset.
  const bottomGap = Math.max(kbHeight, insets.bottom);
  const sheetMaxH = Math.min(winH * 0.75, winH - insets.top - bottomGap - 16);
  const visibleOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const selected = useMemo(
    () => options.find((o) => o.id === selectedId)?.name,
    [options, selectedId],
  );

  return (
    <View style={[styles.container, disabled && { opacity: 0.5 }]}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        onPress={() => { if (disabled) return; setQuery(""); setOpen(true); }}
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
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          style={styles.overlay}
        >
          <View
            style={[styles.sheet, { maxHeight: sheetMaxH, paddingBottom: bottomGap + getHeight(8) }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.sheetTitle}>{modalTitle}</Text>
            {searchable ? (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
                style={styles.searchInput}
              />
            ) : null}
            <FlatList
              data={visibleOptions}
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
                      isSelected && { borderColor: TERRACE_COLORS.orange, backgroundColor: TERRACE_COLORS.greenTint },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && { color: TERRACE_COLORS.orange, fontFamily: "Manrope_700Bold" },
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
              contentContainerStyle={{ paddingBottom: getHeight(12) }}
              style={{ flexShrink: 1 }}
            />
          </View>
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
    fontFamily: "Manrope_700Bold",
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
  },
  sheetTitle: {
    fontSize: getWidth(17),
    fontFamily: "Manrope_500Medium",
    color: TERRACE_COLORS.textDark,
    marginBottom: getHeight(14),
  },
  searchInput: {
    borderWidth: 1,
    borderColor: TERRACE_COLORS.inputBorder,
    borderRadius: getWidth(12),
    paddingHorizontal: getWidth(14),
    paddingVertical: getHeight(10),
    marginBottom: getHeight(12),
    fontSize: getWidth(15),
    fontFamily: "Manrope_500Medium",
    color: TERRACE_COLORS.textDark,
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
    fontFamily: "Manrope_500Medium",
  },
});
