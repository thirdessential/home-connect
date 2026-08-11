import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BANNER_ORANGE = "#EA580C";
const BANNER_BG = "#FDEDE1";

const WelcomeVerificationCard = memo(() => {
  const handleVerifyPress = useCallback(() => {
    router.push("/onboarding/verify-role");
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark" size={22} color={BANNER_ORANGE} />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>
          Verify your account to unlock everything
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          Verify as a resident or business to connect, interact and access all
          features.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.verifyButton}
        onPress={handleVerifyPress}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Verify Now</Text>
      </TouchableOpacity>
    </View>
  );
});

WelcomeVerificationCard.displayName = "WelcomeVerificationCard";

export default WelcomeVerificationCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: BANNER_BG,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: BANNER_ORANGE,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#1F2430",
    marginBottom: 2,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 17,
    color: "#6B5B4D",
  },
  verifyButton: {
    backgroundColor: BANNER_ORANGE,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
