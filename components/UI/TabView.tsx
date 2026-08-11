import { useTheme } from "@/theme/theme";
import { TabViewProps } from "@/types/common.type";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TabView({ activeTab, onTabChange }: TabViewProps) {
  const t = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "details" && {
              ...styles.activeTab,
              borderBottomColor: t.colors.primary,
            },
          ]}
          onPress={() => onTabChange("details")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "details" && {
                ...styles.activeTabText,
                color: t.colors.primary,
              },
            ]}
          >
            Product Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "faq" && {
              ...styles.activeTab,
              borderBottomColor: t.colors.primary,
            },
          ]}
          onPress={() => onTabChange("faq")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "faq" && {
                ...styles.activeTabText,
                color: t.colors.primary,
              },
            ]}
          >
            Product Review
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    fontWeight: "bold",
  },
});