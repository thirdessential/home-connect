import { useTheme } from "@/theme/theme";
import { Society } from "@/types/society.type";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  isSuperAdmin: boolean;
  selectedSociety: Society | null;
  onSocietyPress: () => void;
};

const DashboardHeader = memo(function DashboardHeader({
  isSuperAdmin,
  selectedSociety,
  onSocietyPress,
}: Props) {
  const t = useTheme();

  if (isSuperAdmin) {
    return (
      <TouchableOpacity onPress={onSocietyPress}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[t.typography.h2, { color: t.colors.textPrimary }]}>
                {selectedSociety ? selectedSociety.name : "Select Society"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={24}
                color={t.colors.textPrimary}
                style={styles.chevron}
              />
            </View>
            <Text
              style={[t.typography.body, { color: t.colors.textSecondary }]}
            >
              Review requests or browse approved members.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.header}>
      <Text style={[t.typography.h2, { color: t.colors.textPrimary }]}>
        {selectedSociety ? selectedSociety.name : "Verification"}
      </Text>
      <Text style={[t.typography.body, { color: t.colors.textSecondary }]}>
        Review requests or browse approved members.
      </Text>
    </View>
  );
});

export default DashboardHeader;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  chevron: { marginLeft: 4 },
});
