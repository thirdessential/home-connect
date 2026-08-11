import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import { images } from "@/assets/images";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type Props = {
  /** Show a back chevron in the top-left corner. */
  onBack?: () => void;
  /** Compact variant used on inner screens (smaller logo). */
  compact?: boolean;
};

/**
 * Terrace brand lockup (logo + wordmark + tagline baked into the asset).
 * Shared by the login, OTP and onboarding screens.
 */
export default function TerraceHeader({ onBack, compact = false }: Props) {
  return (
    <View style={styles.container}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.back}
          hitSlop={12}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BlurView intensity={40} tint="light" style={styles.backBlur}>
            <Ionicons
              name="arrow-back"
              size={getWidth(22)}
              color={TERRACE_COLORS.textDark}
            />
          </BlurView>
        </TouchableOpacity>
      ) : null}

      <Image
        source={images.AuthLogo}
        style={[styles.logo, compact ? styles.logoCompact : styles.logoFull]}
        contentFit="contain"
        transition={150}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: getHeight(4),
  },
  back: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 2,
  },
  backBlur: {
    width: getWidth(40),
    height: getWidth(40),
    borderRadius: getWidth(20),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    // Fallback tint if the platform can't render a live blur.
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  logo: {
    aspectRatio: 2.5,
  },
  logoFull: {
    width: getWidth(200),
  },
  logoCompact: {
    width: getWidth(168),
  },
});
