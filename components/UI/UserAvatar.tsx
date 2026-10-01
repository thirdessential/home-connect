import { buildImageUrl } from "@/lib/imageUtils";
import { getAvatarGradient, getAvatarInitials } from "@/lib/avatar";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useEffect, useState } from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";

type Props = {
  /** Profile photo (relative or absolute). Falls back to initials when missing/broken. */
  uri?: string | null;
  name?: string | null;
  /** User id — seeds the gradient so it is the same everywhere. */
  userId?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Profile photo, or bold white initials on a per-user gradient. */
function UserAvatar({ uri, name, userId, size = 40, style }: Props) {
  const resolved = uri ? buildImageUrl(uri) ?? uri : null;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [resolved]);

  const base = { width: size, height: size, borderRadius: size / 2, overflow: "hidden" as const };

  if (resolved && !failed) {
    return (
      <Image
        source={{ uri: resolved }}
        style={[base, { backgroundColor: "#E5E7EB" }, style as any]}
        contentFit="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  const [c1, c2] = getAvatarGradient(userId || name);
  return (
    <LinearGradient
      colors={[c1, c2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[base, { alignItems: "center", justifyContent: "center" }, style]}
    >
      <Text
        allowFontScaling={false}
        style={{
          color: "#FFFFFF",
          fontFamily: "Manrope_700Bold",
          // fontWeight: "700",
          fontSize: Math.max(10, size * 0.38),
          includeFontPadding: false,
          textAlign: "center",
          textShadowColor: "rgba(0,0,0,0.18)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}
      >
        {getAvatarInitials(name)}
      </Text>
    </LinearGradient>
  );
}

export default memo(UserAvatar);
