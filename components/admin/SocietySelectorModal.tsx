import FormSheetModal from "@/components/modals/FormSheetModal";
import { useTheme } from "@/theme/theme";
import { Society } from "@/types/society.type";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  societies: Society[];
  selectedSociety: Society | null;
  search: string;
  onSearchChange: (text: string) => void;
  onClose: () => void;
  onSelectSociety: (society: Society) => void;
};

const styles = StyleSheet.create({
  searchWrapper: { paddingHorizontal: 16, paddingTop: 8 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  list: { maxHeight: 420 },
  societyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  societyInfo: { flex: 1 },
  societyName: { fontSize: 15, fontWeight: "600" },
  societyLocality: { fontSize: 13, marginTop: 2 },
  empty: { padding: 24, alignItems: "center" },
});

const NoSocieties = (
  <View style={styles.empty}>
    <Text style={{ color: "#6B7280" }}>No societies found.</Text>
  </View>
);

const SocietySelectorModal = memo(function SocietySelectorModal({
  visible,
  societies,
  selectedSociety,
  search,
  onSearchChange,
  onClose,
  onSelectSociety,
}: Props) {
  const t = useTheme();

  const filteredSocieties = search.trim()
    ? societies.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.locality?.toLowerCase().includes(search.toLowerCase()),
      )
    : societies;

  const keyExtractor = useCallback((item: Society) => item._id, []);

  const renderItem = useCallback(
    ({ item }: { item: Society }) => {
      const isSelected = selectedSociety?._id === item._id;
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSelectSociety(item)}
          style={[
            styles.societyRow,
            {
              borderBottomColor: t.colors.border,
              backgroundColor: isSelected ? t.colors.surface : "transparent",
            },
          ]}
        >
          <View style={styles.societyInfo}>
            <Text style={[styles.societyName, { color: t.colors.textPrimary }]}>
              {item.name}
            </Text>
            <Text
              style={[
                styles.societyLocality,
                { color: t.colors.textSecondary },
              ]}
            >
              {item.locality || "Address not available"}
            </Text>
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={t.colors.primary}
            />
          )}
        </TouchableOpacity>
      );
    },
    [selectedSociety?._id, onSelectSociety, t.colors],
  );

  return (
    <FormSheetModal
      visible={visible}
      onClose={onClose}
      title="Select Society"
      scroll={false}
    >
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: t.colors.surface },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={t.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search for your society"
            placeholderTextColor={t.colors.textSecondary}
            value={search}
            onChangeText={onSearchChange}
            style={[styles.searchInput, { color: t.colors.textPrimary }]}
          />
        </View>
      </View>
      <FlatList
        data={filteredSocieties}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        style={styles.list}
        ListEmptyComponent={NoSocieties}
      />
    </FormSheetModal>
  );
});

export default SocietySelectorModal;
