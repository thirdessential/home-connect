import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function NoDataCard({
  iconName,
  message,
  subText,
}: {
  iconName?: keyof typeof Ionicons.glyphMap;
  message?: string;
  subText?: string;
}) {
  const t = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={iconName}
        size={40}
        color={t.colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: t.colors.textPrimary }]}>
        {message || "No Data Available"}
      </Text>
      <Text style={[styles.emptySubtitle, { color: t.colors.textSecondary }]}>
        {subText ||
          "Your order history will appear here once you place your first order."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
