import { AUTH_PAGE } from "@/assets/constants/auth.constant";
import { Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { getWidth, getHeight, useTheme } from "../../theme/theme";

export default function UnderlineOTP({
  value,
  onPress,
}: {
  value: string;
  onPress: () => void;
}) {
  const t = useTheme();

  // Pure display: 6 slots with bottom border
  const slots = Array.from({ length: AUTH_PAGE.OTP_LENGTH }).map(
    (_, i) => value[i] ?? ""
  );

  const activeIndex = value.length;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        {slots.map((ch, i) => {
          const isActive = i === activeIndex;
          const isFilled = ch !== "";
          return (
            <View key={i} style={{ alignItems: "center", marginHorizontal: getWidth(8) }}>
              <Text
                style={{
                  fontSize: getWidth(24),
                  fontWeight: "600",
                  color: isFilled ? t.colors.textPrimary : t.colors.textSecondary,
                  width: getWidth(28),
                  textAlign: "center",
                  height: getHeight(32),
                  lineHeight: getHeight(32),
                }}
              >
                {ch}
              </Text>
              <View
                style={{
                  height: getHeight(2.5),
                  width: getWidth(26),
                  marginTop: getHeight(4),
                  backgroundColor: isActive
                    ? t.colors.primary
                    : isFilled
                      ? t.colors.textPrimary
                      : t.colors.border,
                }}
              />
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}
