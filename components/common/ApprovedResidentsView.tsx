import CircularImage from "@/components/form/CircularImage";
import { Card } from "@/components/UI/Card";
import { useTheme } from "@/theme/theme";
import { Tower } from "@/types/society.type";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface ApprovedResidentsViewProps {
  residents: any[];
  /** Used to show each resident's tower name (All Residents view). */
  towerList?: Tower[];
  showTower?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
}

/** Resident cards for one already society/tower-scoped list. */
const ApprovedResidentsView: React.FC<ApprovedResidentsViewProps> = ({
  residents,
  towerList = [],
  showTower = false,
  emptyTitle = "No approved residents yet",
  emptySubtitle,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const towerName = (user: any) =>
    towerList.find((t) => t._id === user?.tower || t.name === user?.tower)?.name ?? user?.tower;

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}>
      {residents.length === 0 ? (
        <View style={{ alignItems: "center", padding: 40, borderWidth: 1, borderStyle: "dashed", borderColor: theme.colors.border, borderRadius: 18 }}>
          <Ionicons name="people-outline" size={28} color={theme.colors.textSecondary} />
          <Text style={{ marginTop: 10, fontFamily: "Manrope_700Bold", color: theme.colors.textPrimary }}>{emptyTitle}</Text>
          {emptySubtitle ? (
            <Text style={{ marginTop: 4, fontSize: 13, color: theme.colors.textSecondary, textAlign: "center" }}>{emptySubtitle}</Text>
          ) : null}
        </View>
      ) : (
        residents.map((user: any, index: number) => (
            <Card
              key={user._id ?? index}
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
                  name={user.fullName}
                  avatarUserId={String(user._id ?? user.fullName ?? "")}
                  size={56}
                  mode="view"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: "Manrope_700Bold", color: theme.colors.textPrimary }}>
                    {user.fullName}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 3 }}>
                    <Text style={{ fontSize: 12.5, color: theme.colors.textSecondary }}>
                      Flat {user.flatNo}
                    </Text>
                    {showTower && towerName(user) ? (
                      <Text style={{ fontSize: 12.5, color: theme.colors.textSecondary }}>
                        Tower {towerName(user)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <Ionicons name="checkmark-circle" size={14} color={theme.colors.brand} />
                    <Text style={{ fontSize: 12, fontFamily: "Manrope_600SemiBold", color: theme.colors.brand }}>
                      Verified resident
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Card>
        ))
      )}
    </View>
  );
};

export default ApprovedResidentsView;
