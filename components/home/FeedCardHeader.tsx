import { useTheme } from "@/theme/theme";
import { HomeFeedAuthor } from "@/types/homeFeed.type";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  author: HomeFeedAuthor;
  meta: string;
  isPublic?: boolean;
  /** "EVENT" pill next to the name. */
  badge?: string;
  /** Light text for headers drawn over a photo. */
  onImage?: boolean;
  onMorePress?: () => void;
};

/**
 * Avatar + name + verified + EVENT badge + meta line + ⋮, shared by all four
 * card types. On a plain card the text follows the theme, so the author name
 * is never white-on-white.
 */
function FeedCardHeader({
  author,
  meta,
  isPublic = true,
  badge,
  onImage = false,
  onMorePress,
}: Props) {
  const t = useTheme();
  const nameColor = onImage ? "#FFFFFF" : t.colors.textPrimary;
  const metaColor = onImage ? "rgba(255,255,255,0.8)" : t.colors.textSecondary;
  const moreColor = onImage ? "rgba(255,255,255,0.85)" : t.colors.textSecondary;
  const verifiedColor = onImage ? "#FFFFFF" : "#2296F3";

  return (
    <View style={styles.row}>
      {author.avatarUrl ? (
        <Image
          source={{ uri: author.avatarUrl }}
          style={[
            styles.avatar,
            { borderColor: onImage ? "rgba(255,255,255,0.25)" : t.colors.border },
          ]}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarFallback,
            { backgroundColor: t.colors.brand, borderColor: t.colors.border },
          ]}
        >
          <Text style={[styles.initials, { color: t.colors.onBrand }]}>
            {author.initials}
          </Text>
        </View>
      )}

      <View style={styles.textCol}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, { color: nameColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {author.name}
          </Text>
          {author.verified && (
            <MaterialIcons name="verified" size={15} color={verifiedColor} style={styles.fixed} />
          )}
          {!!badge && (
            <View style={[styles.badge, {
              backgroundColor: onImage? "#fff" : "#e5ffe2",
            }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: metaColor }]} numberOfLines={1}>
            {meta}
          </Text>
          {isPublic && (
            <Ionicons name="globe-outline" size={11} color={metaColor} />
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={onMorePress}
        hitSlop={8}
        style={styles.more}
        accessibilityRole="button"
        accessibilityLabel="More options"
      >
        <Ionicons name="ellipsis-vertical" size={18} color={moreColor} />
      </TouchableOpacity>
    </View>
  );
}

export default memo(FeedCardHeader);

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1 },
  avatarFallback: { alignItems: "center", justifyContent: "center", borderWidth: 0 },
  initials: { fontSize: 15, fontWeight: "700" },
  textCol: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { fontSize: 16, fontWeight: "600", letterSpacing: -0.16, flexShrink: 1 },
  fixed: { flexShrink: 0 },
  badge: {
    flexShrink: 0,
    marginLeft: 3,
    backgroundColor: "#e5ffe2",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    color: "#002114",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  meta: { fontSize: 11, lineHeight: 16, flexShrink: 1 },
  more: { padding: 4, flexShrink: 0 },
});
