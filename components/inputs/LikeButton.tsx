import { useFeedsStore } from "@/store/useFeedsStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface LikeButtonProps {
  feedId: string;
  likes?: any[];
  style?: any;
  size?: number;
  showCount?: boolean;
  onBeforeLike?: () => boolean; // Return true to prevent like action
}

export default function LikeButton({
  feedId,
  likes,
  style,
  size,
  showCount = true,
  onBeforeLike,
}: LikeButtonProps) {
  const t = useTheme();
  const toggleLike = useFeedsStore((state) => state.toggleLike);
  const userId = useUserStore((state) => state.user?._id);

  // Check if current user has liked
  const hasUserLiked = useMemo(() => {
    if (!userId || !likes) return false;
    return likes.some((like: any) =>
      typeof like === "string" ? like === userId : like._id === userId
    );
  }, [likes, userId]);

  // Count total likes
  const likesCount = useMemo(() => {
    return likes?.length || 0;
  }, [likes]);

  const handleToggleLike = () => {
    // Check if action should be prevented (e.g., guest user)
    if (onBeforeLike && onBeforeLike()) {
      return; // Prevent like action
    }

    if (feedId && userId) {
      toggleLike(feedId, userId);
    }
  };

  const iconSize = size ?? t.iconSizes.xs;
  const likedColor = "#EF4444";
  const defaultColor = "#888";

  return (
    <TouchableOpacity
      onPress={handleToggleLike}
      style={[styles.container, style]}
    >
      <Ionicons
        name={hasUserLiked ? "heart" : "heart-outline"}
        size={iconSize}
        color={hasUserLiked ? likedColor : defaultColor}
        style={{ marginRight: 4 }}
      />
      {showCount && (
        <Text
          style={[
            styles.countText,
            {
              color: hasUserLiked ? likedColor : defaultColor,
              fontWeight: hasUserLiked ? "600" : "400",
            },
          ]}
        >
          {likesCount > 0
            ? `${likesCount} ${likesCount === 1 ? "Like" : "Likes"}`
            : "Like"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  countText: {
    fontSize: 14,
  },
});
