import CircularImage from "@/components/form/CircularImage";
import { useTheme } from "@/theme/theme";
import { Tower } from "@/types/society.type";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

const NO_FLAT = "No flat";

const prettify = (v: string) =>
  v.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();

/** Resident type from data the API actually returns; null when none is available. */
export const residentTypeLabel = (u: any): string | null => {
  const explicit = u?.residentType ?? u?.resident_type ?? u?.residentVerification?.residentType;
  if (explicit) return prettify(String(explicit));
  const roles: string[] = Array.isArray(u?.roles) ? u.roles : [];
  if (roles.includes("owner")) return "Owner";
  if (roles.includes("tenant")) return "Tenant";
  return null;
};

const professionOf = (u: any): string | null => {
  const v = u?.profession ?? u?.occupation;
  return v ? String(v) : null;
};

/** Natural order: 2 < 10 < 101, A-2 < A-10, flats without a number last. */
const compareFlats = (a: string, b: string) => {
  if (a === NO_FLAT) return 1;
  if (b === NO_FLAT) return -1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
};

export const groupResidentsByFlat = (residents: any[]) => {
  const map = new Map<string, any[]>();
  residents.forEach((u) => {
    const flat = String(u?.flatNo ?? "").trim() || NO_FLAT;
    if (!map.has(flat)) map.set(flat, []);
    map.get(flat)!.push(u);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => compareFlats(a, b))
    .map(([flat, items]) => ({ flat, items }));
};

type Props = {
  residents: any[];
  towerList?: Tower[];
  /** Show the tower under each name (All Towers view). */
  showTower?: boolean;
  emptyTitle: string;
  emptySubtitle?: string;
};

/** Flat-grouped resident directory: one card per flat, one row per resident. */
const FlatGroupedResidents: React.FC<Props> = ({ residents, towerList = [], showTower = false, emptyTitle, emptySubtitle }) => {
  const theme = useTheme();
  const router = useRouter();
  const groups = useMemo(() => groupResidentsByFlat(residents), [residents]);
  const towerName = (u: any) => towerList.find((t) => t._id === u?.tower || t.name === u?.tower)?.name ?? u?.tower;

  if (groups.length === 0) {
    return (
      <View style={{ margin: 20, alignItems: "center", padding: 40, borderWidth: 1, borderStyle: "dashed", borderColor: theme.colors.border, borderRadius: 18 }}>
        <Ionicons name="people-outline" size={28} color={theme.colors.textSecondary} />
        <Text style={{ marginTop: 10, fontFamily: "Manrope_700Bold", color: theme.colors.textPrimary }}>{emptyTitle}</Text>
        {emptySubtitle ? (
          <Text style={{ marginTop: 4, fontSize: 13, color: theme.colors.textSecondary, textAlign: "center" }}>{emptySubtitle}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      {groups.map(({ flat, items }) => (
        <View key={flat} style={{ marginBottom: 18 }}>
          <Text style={{ fontSize: 16, fontFamily: "Manrope_700Bold", color: theme.colors.textPrimary, marginBottom: 8, marginLeft: 4 }}>
            {flat}
          </Text>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: "hidden",
            }}
          >
            {items.map((u: any, i: number) => {
              const type = residentTypeLabel(u);
              const prof = professionOf(u);
              return (
                <Pressable
                  key={u._id ?? i}
                  onPress={() => router.navigate(`/(tabs)/profile/user-profile-screen?id=${u._id}`)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: theme.colors.border,
                  }}
                >
                  <CircularImage
                    uri={u.profilePhotoUrl}
                    name={u.fullName}
                    avatarUserId={String(u._id ?? u.fullName ?? "")}
                    size={48}
                    mode="view"
                  />
                  <View style={{ flex: 1 }}>
                    {type ? (
                      <Text style={{ fontSize: 12, fontFamily: "Manrope_600SemiBold", color: theme.colors.brand }}>{type}</Text>
                    ) : null}
                    <Text style={{ fontSize: 15, fontFamily: "Manrope_700Bold", color: theme.colors.textPrimary }}>{u.fullName}</Text>
                    {prof ? <Text style={{ fontSize: 12.5, color: theme.colors.textSecondary, marginTop: 1 }}>{prof}</Text> : null}
                    {showTower && towerName(u) ? (
                      <Text style={{ fontSize: 12.5, color: theme.colors.textSecondary, marginTop: 1 }}>Tower {towerName(u)}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

export default FlatGroupedResidents;
