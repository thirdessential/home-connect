import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  title: string;
  subtitle?: string;
  containerStyle?: ViewStyle;
}

const EmptyState = memo(
  ({
    icon = "document-outline",
    iconSize = 64,
    title,
    subtitle,
    containerStyle,
  }: EmptyStateProps) => {
    const t = useTheme();

    return (
      <View style={[styles.container, containerStyle]}>
        <Ionicons
          name={icon}
          size={iconSize}
          color={t.colors.textSecondary}
          style={styles.icon}
        />
        <Text style={[styles.title, { color: t.colors.textPrimary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: t.colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    );
  }
);

EmptyState.displayName = "EmptyState";

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
