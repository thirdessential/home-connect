import ActionButton from "@/components/inputs/ActionButton";
import { formatDateComment } from "@/lib/dateTime";
import { Theme, useTheme } from "@/theme/theme";
import { CustomerReviewProps, Review } from "@/types/common.type";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import ReviewItem from "./ReviewItem";

const ReviewCard = memo(
  ({ review, theme }: { review: Review; theme: Theme }) => {
    return (
      <View
        style={[
          styles.reviewCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.reviewHeader}>
          <View>
            <Text
              style={[styles.reviewerName, { color: theme.colors.textPrimary }]}
            >
              {review.userName}
            </Text>
            <Text
              style={[styles.reviewDate, { color: theme.colors.textSecondary }]}
            >
              Reviewed{" "}
              {review.createdAt ? formatDateComment(review.createdAt) : ""}
            </Text>
          </View>
        </View>

        <View style={styles.starsContainer}>
          {[...Array(5)].map((_, i) => (
            <Ionicons
              key={i}
              name={i < (review?.rating ?? 0) ? "star" : "star-outline"}
              size={14}
              color="#FFB800"
              style={{ marginRight: 2 }}
            />
          ))}
        </View>

        <Text
          style={[styles.reviewComment, { color: theme.colors.textPrimary }]}
        >
          {review.comment}
        </Text>
      </View>
    );
  },
);
ReviewCard.displayName = "ReviewCard";

export const CustomerReview = memo(
  ({ reviews, onAddReview, containerStyle, disabled }: CustomerReviewProps) => {
    const theme = useTheme();
    return (
      <View style={[styles.container, containerStyle]}>
        {reviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="star-outline"
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.emptyStateText,
                { color: theme.colors.textSecondary },
              ]}
            >
              No reviews yet. Be the first to review!
            </Text>
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item, index) =>
              item._id ? String(item._id) : `review_${index}`
            }
            renderItem={({ item }) => (
              // <ReviewCard review={item} theme={theme} />
              <ReviewItem review={item} showDivider={true} />
            )}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
        <ActionButton
          title="Write a Review"
          variant="outline"
          size="md"
          onPress={onAddReview}
          disabled={disabled}
          fullWidth
        />
      </View>
    );
  },
  (prev, next) => {
    // Check if reviews arrays have same length and content
    if (prev.reviews.length !== next.reviews.length) return false;
    if (prev.onAddReview !== next.onAddReview) return false;
    if (prev.containerStyle !== next.containerStyle) return false;

    // Check if review items are the same
    return prev.reviews.every((review, index) => {
      const nextReview = next.reviews[index];
      return (
        review._id === nextReview._id &&
        review.rating === nextReview.rating &&
        review.comment === nextReview.comment &&
        review.userName === nextReview.userName
      );
    });
  },
);
CustomerReview.displayName = "CustomerReview";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  averageRating: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: "#6B7280",
  },
  addReviewButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  addReviewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#15803D",
  },
  reviewCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  reviewDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
    color: "#1F2937",
    marginTop: 8,
  },
  separator: {
    height: 0,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
});

export { Review };
