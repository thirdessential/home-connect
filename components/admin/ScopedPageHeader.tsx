import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
  /** Society name (from the selected society — never hardcoded). */
  subtitle?: string | null;
  onBack: () => void;
  /** Omit to hide the search icon. */
  onSearchToggle?: () => void;
  searching?: boolean;
  query?: string;
  onQueryChange?: (q: string) => void;
  searchPlaceholder?: string;
};

/** Back arrow + title/society + search icon; the input only appears once the icon is tapped. */
const ScopedPageHeader = memo(function ScopedPageHeader({
  title,
  subtitle,
  onBack,
  onSearchToggle,
  searching,
  query,
  onQueryChange,
  searchPlaceholder = "Search",
}: Props) {
  const t = useTheme();
  return (
    <View>
      <View style={styles.row}>
        <TouchableOpacity onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back" style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.sub, { color: t.colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>
        {onSearchToggle ? (
          <TouchableOpacity
            onPress={onSearchToggle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={searching ? "Close search" : "Search"}
            style={styles.iconBtn}
          >
            <Ionicons name={searching ? "close" : "search"} size={22} color="#1F2937" />
          </TouchableOpacity>
        ) : null}
      </View>
      {searching ? (
        <View style={[styles.searchBox, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
          <Ionicons name="search" size={16} color={t.colors.textSecondary} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={onQueryChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={t.colors.textSecondary}
            style={[styles.input, { color: t.colors.textPrimary }]}
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>
      ) : null}
    </View>
  );
});

export default ScopedPageHeader;

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  iconBtn: { paddingVertical: 8 },
  text: { flex: 1 },
  title: { fontFamily: "Manrope_600SemiBold", fontSize: 18, color: "#1F2937" },
  sub: { fontSize: 13.5, marginTop: 2 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 14.5 },
});
