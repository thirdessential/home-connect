import { dir } from "@/theme/directory";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
};

const CategoryTile = memo(function CategoryTile({ label, icon, active, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.wrap} onPress={onPress} accessibilityLabel={`${label} category`}>
      <View style={[styles.tile, active ? styles.tileActive : styles.tileIdle]}>
        <Ionicons name={icon} size={24} color={active ? dir.green : dir.ink} />
      </View>
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  wrap: { width: 62, alignItems: "center", gap: 6 },
  tile: { width: 56, height: 56, borderRadius: dir.radius.tile, alignItems: "center", justifyContent: "center" },
  tileActive: { backgroundColor: dir.lime },
  tileIdle: { backgroundColor: "#fff", borderWidth: 1, borderColor: dir.border },
  label: { fontFamily: dir.font.semi, fontSize: 12, color: "#3A4A40" },
  labelActive: { fontFamily: dir.font.bold, color: dir.ink },
});

export default CategoryTile;
