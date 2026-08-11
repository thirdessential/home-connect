import { useSocietyStore } from "@/store/useSocietyStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { Text, View } from "react-native";
import { Card } from "../UI/Card";

const InfoItem = memo(
  ({
    icon,
    label,
    value,
    color,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    color?: string;
  }) => {
    const t = useTheme();
    return (
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: t.colors.surfaceAlt,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Ionicons name={icon} size={24} color={color || t.colors.primary} />
        </View>
        <Text style={{ fontSize: 12, color: t.colors.textSecondary }}>
          {label}
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: t.colors.textPrimary,
          }}
        >
          {value}
        </Text>
      </View>
    );
  }
);
InfoItem.displayName = "InfoItem";

const SocietyInfoCard = memo(function SocietyInfoCard() {
  const t = useTheme();
  const { selectedSociety } = useSocietyStore();

  // Memoize info items to avoid unnecessary re-renders
  const infoItems = useMemo(
    () => [
      {
        icon: "home-outline" as keyof typeof Ionicons.glyphMap,
        label: "Total Flats",
        value: selectedSociety?.totalFlats?.toString() || "N/A",
        color: t.colors.primary,
      },
      {
        icon: "people-outline" as keyof typeof Ionicons.glyphMap,
        label: "Residents",
        value: selectedSociety?.totalResidents?.toString() || "N/A",
        color: t.colors.primary,
      },
      {
        icon: "business-outline" as keyof typeof Ionicons.glyphMap,
        label: "Buildings",
        value: selectedSociety?.towers?.length?.toString() || "N/A",
        color: t.colors.primary,
      },
    ],
    [selectedSociety, t.colors.primary]
  );

  if (!selectedSociety) return null;

  return (
    <Card style={{ marginBottom: 16 }}>
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons name="business" size={24} color={t.colors.primary} />
          <Text
            style={{
              marginLeft: 8,
              color: t.colors.primary, // Use primary color for title
              ...t.typography.h3, // Use theme's h3 for extra polish
            }}
          >
            Society Information
          </Text>
        </View>

        <View
          style={{
            backgroundColor: t.colors.surfaceAlt,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: t.colors.textPrimary,
            }}
          >
            {selectedSociety.name}
          </Text>

          {selectedSociety.completeAddress && (
            <View
              style={{
                flexDirection: "row",
                marginTop: 12,
              }}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={t.colors.textSecondary}
                style={{ marginTop: 2 }}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: t.colors.textSecondary,
                  marginLeft: 6,
                  flex: 1,
                }}
              >
                {selectedSociety.completeAddress}
              </Text>
            </View>
          )}

          {selectedSociety.city && selectedSociety.state && (
            <Text
              style={{
                fontSize: 14,
                color: t.colors.textSecondary,
                marginTop: 4,
                marginLeft: 22,
              }}
            >
              {selectedSociety.city}, {selectedSociety.state}
              {selectedSociety.pincode ? ` - ${selectedSociety.pincode}` : ""}
            </Text>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          {infoItems.map((item, idx) => (
            <InfoItem key={item.label} {...item} />
          ))}
        </View>

        {selectedSociety.maintenanceCharge && (
          <View
            style={{
              backgroundColor: "#F0FFF4", // Light green
              padding: 12,
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: "#48BB78", // Green
            }}
          >
            <Text style={{ fontSize: 14, color: "#2F855A", fontWeight: "600" }}>
              Monthly Maintenance
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: "#2C7A7B",
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              ₹ {selectedSociety.maintenanceCharge}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
});

export default SocietyInfoCard;
