import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";

export type ErrorType =
  | "network"
  | "notfound"
  | "permission"
  | "validation"
  | "unknown"
  | "empty"
  | string;

interface ErrorMessageProps {
  type?: ErrorType;
  message?: string;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  showIcon?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
}

const DEFAULT_MESSAGES: Record<ErrorType, string> = {
  network: "Network error. Please check your connection and try again.",
  notfound: "No results found.",
  permission: "Permission denied. Please allow access and try again.",
  validation: "Invalid input. Please check your entries.",
  unknown: "Something went wrong. Please try again.",
  empty: "No data available.",
};

export default function ErrorMessage({
  type = "unknown",
  message,
  containerStyle,
  textStyle,
  showIcon = true,
  iconName,
}: ErrorMessageProps) {
  const displayMsg =
    message || DEFAULT_MESSAGES[type] || DEFAULT_MESSAGES.unknown;

  // Choose palette based on type
  let bg = "#FEF2F2"; // red-50
  let border = "#FECACA"; // red-200
  let iconColor = "#B91C1C"; // red-700
  let txt = "#7F1D1D"; // red-900
  let fallbackIcon: keyof typeof Ionicons.glyphMap = "alert-circle-outline";

  if (type === "permission") {
    bg = "#FFFBEB"; // amber-50
    border = "#FDE68A"; // amber-300
    iconColor = "#92400E"; // amber-800
    txt = "#92400E";
    fallbackIcon = "warning-outline";
  } else if (type === "notfound" || type === "empty") {
    bg = "#F1F5F9"; // slate-100
    border = "#E2E8F0"; // slate-300
    iconColor = "#475569"; // slate-600
    txt = "#334155"; // slate-700
    fallbackIcon = "information-circle-outline";
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bg, borderColor: border },
        containerStyle,
      ]}
    >
      {showIcon ? (
        <Ionicons
          name={iconName || fallbackIcon}
          size={18}
          color={iconColor}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.text, { color: txt }, textStyle]}>{displayMsg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  icon: {
    marginTop: 2,
    marginRight: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    alignSelf: "center",
  },
});