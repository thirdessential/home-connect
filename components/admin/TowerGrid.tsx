import { Card } from "@/components/UI/Card";
import { useTheme } from "@/theme/theme";
import { Tower } from "@/types/society.type";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

// A resident belongs to a tower when their stored tower matches the tower's id or name.
export const belongsToTower = (user: any, tower: Tower): boolean => {
  const candidates = [user?.tower, user?.selected_society?.towerName].filter(Boolean) as string[];
  return candidates.some((v) => v === tower._id || v === tower.name);
};

/** Groups a society's approved residents by tower (only towers of that society). */
export const groupResidentsByTower = (residents: any[], towers: Tower[]): Map<string, any[]> => {
  const map = new Map<string, any[]>();
  (towers || []).forEach((t) => map.set(t._id, []));
  (residents || []).forEach((u) => {
    const match = (towers || []).find((t) => belongsToTower(u, t));
    if (match) map.get(match._id)!.push(u);
  });
  return map;
};

type Props = {
  towers: Tower[];
  countFor: (towerId: string) => number;
  totalResidents: number;
  onSelectTower: (towerId: string) => void;
  onSelectAll: () => void;
};

const countLabel = (n: number) => (n ? `${n} resident${n > 1 ? "s" : ""}` : "No residents yet");

/** Dashboard "Towers" section — each tile opens that tower's resident list. */
const TowerGrid = memo(function TowerGrid({ towers, countFor, totalResidents, onSelectTower, onSelectAll }: Props) {
  const theme = useTheme();
  if (!towers?.length) return null;

  const tile = (key: string, label: string, sub: string, onPress: () => void) => (
    <TouchableOpacity key={key} onPress={onPress} activeOpacity={0.75} style={{ width: "47%" }}>
      <Card
        style={{
          padding: 18,
          backgroundColor: theme.colors.surface,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text style={{ fontSize: 26, fontFamily: "Manrope_700Bold", color: theme.colors.textPrimary, marginBottom: 10 }}>
          {label}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>{sub}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}>
      <Text style={[theme.typography.h5, { color: theme.colors.textPrimary, fontSize: 19, marginBottom: 12 }]}>Towers</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {tile("all", "All", `All towers · ${countLabel(totalResidents)}`, onSelectAll)}
        {towers.map((tower) =>
          tile(tower._id, tower.name?.[0] ?? "?", countLabel(countFor(tower._id)), () => onSelectTower(tower._id)),
        )}
      </View>
    </View>
  );
});

export default TowerGrid;
