import CircularImage from "@/components/form/CircularImage";
import { Card } from "@/components/UI/Card";
import { useTheme } from "@/theme/theme";
import { Tower } from "@/types/society.type";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ApprovedResidentsViewProps {
  approvedUsers: any[];
  towerList: Tower[];
}

const ApprovedResidentsView: React.FC<ApprovedResidentsViewProps> = ({
  approvedUsers,
  towerList,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const screenWidth = Dimensions.get("window").width;
  const slideX = useRef(new Animated.Value(0)).current;

  // Reset to tower list whenever the society changes (towerList reference changes)
  useEffect(() => {
    setSelectedTower(null);
    slideX.setValue(0);
  }, [towerList, slideX]);

  const animateIn = () => {
    // Start offscreen right -> move to center (right-to-left)
    slideX.setValue(screenWidth);
    Animated.timing(slideX, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const animateOutAndBack = () => {
    Animated.timing(slideX, {
      toValue: screenWidth, // slide out to right
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setSelectedTower(null);
      slideX.setValue(0);
    });
  };

  // Determine if a user belongs to a given tower (match by id or name)
  const belongsToTower = (user: any, tower: Tower): boolean => {
    const userTower: string | undefined = user?.tower; // may be id or name
    const selectedTowerName: string | undefined =
      user?.selected_society?.towerName;
    const candidates = [userTower, selectedTowerName].filter(
      Boolean,
    ) as string[];
    return candidates.some((v) => v === tower._id || v === tower.name);
  };

  // Group users by tower for fast counts and retrieval
  const usersByTower = useMemo(() => {
    const map = new Map<string, any[]>();
    (towerList || []).forEach((t) => map.set(t._id, []));
    (approvedUsers || []).forEach((u) => {
      const match = (towerList || []).find((t) => belongsToTower(u, t));
      if (match) {
        const arr = map.get(match._id)!;
        arr.push(u);
      }
    });
    return map;
  }, [approvedUsers, towerList]);

  // Get count of users per tower
  const getTowerUserCount = (towerId: string): number => {
    return usersByTower.get(towerId)?.length || 0;
  };

  // Get users for selected tower
  const getUsersForTower = (towerId: string | null): any[] => {
    if (!towerId) return [];
    return usersByTower.get(towerId) || [];
  };

  // Show tower list view
  if (!selectedTower) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.white }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 6,
          }}
        >
          <Text style={[theme.typography.h5, { color: theme.colors.textPrimary, fontSize: 19 }]}>
            Towers
          </Text>
        </View>

        {/* Tower grid — 2/3/4 columns like the reference design */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
            {towerList?.map((tower) => {
              const count = getTowerUserCount(tower?._id);
              return (
                <TouchableOpacity
                  key={tower?._id}
                  onPress={() => {
                    setSelectedTower(tower?._id);
                    animateIn();
                  }}
                  activeOpacity={0.75}
                  style={{ width: "47%" }}
                >
                  <Card
                    style={{
                      padding: 18,
                      backgroundColor: theme.colors.surface,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 26, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 10 }}>
                      {tower?.name?.[0] ?? "?"}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                        {count ? `${count} resident${count > 1 ? "s" : ""}` : "No residents yet"}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Show users for selected tower
  const towerUsers = getUsersForTower(selectedTower);
  const selectedTowerName =
    towerList.find((t) => t._id === selectedTower)?.name || selectedTower;

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: theme.colors.white,
        transform: [{ translateX: slideX }],
      }}
    >
      {/* Back link + heading, matching the tower-drilldown header pattern */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 }}>
        <TouchableOpacity
          onPress={animateOutAndBack}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14, alignSelf: "flex-start" }}
        >
          <Ionicons name="arrow-back" size={16} color={theme.colors.brandDark ?? theme.colors.primary} />
          <Text style={{ fontSize: 14.5, fontWeight: "700", color: theme.colors.brandDark ?? theme.colors.primary }}>
            All Towers
          </Text>
        </TouchableOpacity>
        <Text style={[theme.typography.h5, { color: theme.colors.textPrimary, fontSize: 19 }]}>
          {selectedTowerName} · {towerUsers.length} resident{towerUsers.length === 1 ? "" : "s"}
        </Text>
      </View>

      {/* Resident cards */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}>
        {towerUsers.length === 0 ? (
          <View style={{ alignItems: "center", padding: 40, borderWidth: 1, borderStyle: "dashed", borderColor: theme.colors.border, borderRadius: 18 }}>
            <Ionicons name="people-outline" size={28} color={theme.colors.textSecondary} />
            <Text style={{ marginTop: 10, fontWeight: "700", color: theme.colors.textPrimary }}>No approved residents yet</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: theme.colors.textSecondary, textAlign: "center" }}>
              {selectedTowerName} has no approved residents at the moment.
            </Text>
          </View>
        ) : (
          towerUsers.map((user: any, index: number) => (
            <Card
              key={index}
              style={{
                marginBottom: 12,
                padding: 14,
                backgroundColor: theme.colors.surface,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Pressable
                onPress={() =>
                  router.navigate(
                    `/(tabs)/profile/user-profile-screen?id=${user._id}`,
                  )
                }
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <CircularImage
                  uri={user.profilePhotoUrl}
                  size={56}
                  mode="view"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.textPrimary }}>
                    {user.fullName}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 3 }}>
                    <Text style={{ fontSize: 12.5, color: theme.colors.textSecondary }}>
                      Flat {user.flatNo}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <Ionicons name="checkmark-circle" size={14} color={theme.colors.brand} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: theme.colors.brand }}>
                      Verified resident
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>
    </Animated.View>
  );
};

export default ApprovedResidentsView;
