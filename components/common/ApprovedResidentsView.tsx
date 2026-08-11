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
      <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: "white",
          }}
        >
          <Text style={[theme.typography.h3, { color: theme.colors.primary }]}>
            Approved Residents
          </Text>
        </View>

        {/* Tower List */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
          {towerList?.map((tower) => (
            <TouchableOpacity
              key={tower?._id}
              onPress={() => {
                setSelectedTower(tower?._id);
                animateIn();
              }}
              activeOpacity={0.7}
            >
              <Card
                style={{
                  marginBottom: 12,
                  padding: 20,
                  backgroundColor: "white",
                  borderRadius: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={[
                      theme.typography.h4,
                      {
                        color: theme.colors.textPrimary,
                        fontWeight: "600",
                        fontSize: 18,
                      },
                    ]}
                  >
                    {tower?.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={[
                        theme.typography.h4,
                        {
                          color: theme.colors.textSecondary,
                          fontSize: 18,
                          fontWeight: "400",
                        },
                      ]}
                    >
                      {getTowerUserCount(tower?._id)}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
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
        backgroundColor: "#F9FAFB",
        transform: [{ translateX: slideX }],
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: "white",
        }}
      >
        <TouchableOpacity
          onPress={animateOutAndBack}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[theme.typography.h3, { color: theme.colors.primary }]}>
          {selectedTowerName} ({towerUsers.length})
        </Text>
      </View>

      {/* User List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        {towerUsers.map((user: any, index: number) => (
          <Card
            key={index}
            style={{
              marginBottom: 12,
              padding: 16,
              backgroundColor: "white",
              borderRadius: 12,
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
                alignItems: "center",
              }}
            >
              <View style={{ marginRight: 12 }}>
                <CircularImage
                  uri={user.profilePhotoUrl}
                  size={50}
                  mode="view"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    theme.typography.body,
                    {
                      fontWeight: "600",
                      color: theme.colors.textPrimary,
                      fontSize: 16,
                    },
                  ]}
                >
                  {user.fullName}
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    {
                      color: theme.colors.textSecondary,
                      marginTop: 4,
                      fontSize: 14,
                    },
                  ]}
                >
                  {user.flatNo}
                </Text>
              </View>
            </Pressable>
          </Card>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

export default ApprovedResidentsView;
