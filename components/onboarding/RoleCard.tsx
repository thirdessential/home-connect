import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RoleOption {
  id: string;
  title: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}

interface RoleSelectionProps {
  onSelectRole: (roleId: string) => void;
  roles?: RoleOption[];
}

const defaultRoles: RoleOption[] = [
  {
    id: "resident",
    title: "I'm a Resident",
    subtitle: "I live in this community",
    iconName: "home-outline",
  },
  {
    id: "business",
    title: "I'm a Local Business",
    subtitle: "I provide services to this community",
    iconName: "storefront-outline",
  },
];

const RoleSelectionCard = memo(
  ({ onSelectRole, roles = defaultRoles }: RoleSelectionProps) => {
    const t = useTheme();

    return (
      <View style={styles.rolesContainer}>
        {roles.map((role, index) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleButton,
              {
                backgroundColor:
                  index === 0 ? t.colors.primary : t.colors.surface,
                borderColor: index === 0 ? t.colors.primary : t.colors.border,
              },
            ]}
            onPress={() => onSelectRole(role.id)}
            activeOpacity={0.8}
          >
            <View style={styles.roleContent}>
              <View style={styles.roleTextContainer}>
                <Text
                  style={[
                    t.typography.h4,
                    styles.roleTitle,
                    {
                      color: index === 0 ? "#fff" : t.colors.textPrimary,
                    },
                  ]}
                >
                  {role.title}
                </Text>
                {role.subtitle && (
                  <Text
                    style={[
                      styles.roleSubtitle,
                      {
                        color: index === 0 ? "#fff" : t.colors.textSecondary,
                      },
                    ]}
                  >
                    {role.subtitle}
                  </Text>
                )}
              </View>

              {role.iconName && (
                <Ionicons
                  name={role.iconName}
                  size={24}
                  color={index === 0 ? "#fff" : t.colors.textSecondary}
                  style={styles.roleIcon}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
);

RoleSelectionCard.displayName = "RoleSelectionCard";

export default RoleSelectionCard;
export type { RoleOption, RoleSelectionProps };

const styles = StyleSheet.create({
  rolesContainer: {
    width: "100%",
    gap: 12,
  },
  roleButton: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    minHeight: 64,
  },
  roleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  roleIcon: {
    marginLeft: 8,
  },
});
