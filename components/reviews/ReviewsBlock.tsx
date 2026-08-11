import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useTheme } from "../../theme/theme";
import AddReviewForm from "./ReviewForm";
import ReviewItem from "./ReviewItem";

export interface Review {
  _id?: string;
  userId?: string;
  userName?: string;
  rating?: number; // 1..5
  profilePhotoUrl?: string;
  comment?: string;
  createdAt?: string;
}

type ReviewsBlockProps = {
  title?: string;
  reviews: Review[];
  onSubmit?: (payload: {
    rating: number;
    comment: string;
  }) => Promise<void> | void;
  submitting?: boolean;
  allowAdd?: boolean; // default true
  emptyText?: string; // default "No reviews yet."
};

export default function ReviewsBlock({
  title = "Customer Reviews",
  reviews,
  onSubmit,
  submitting = false,
  allowAdd = true,
  emptyText = "No reviews yet.",
}: ReviewsBlockProps) {
  const t = useTheme();
  const count = reviews?.length ?? 0;
  const avg =
    count > 0
      ? (
          reviews.map((r) => Number(r.rating || 0)).reduce((a, b) => a + b, 0) /
          count
        ).toFixed(1)
      : "0.0";

  return (
    <View>
      {/* Section title */}
      <Text
        className="mb-2 font-bold"
        style={{ color: t.colors.textPrimary, fontSize: 18 }}
      >
        {title}
      </Text>

      {/* Summary row */}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: t.colors.textPrimary,
          }}
        >
          {avg}
        </Text>
        <View style={{ flexDirection: "row", marginLeft: 8 }}>
          {[...Array(5)].map((_, i) => (
            <Ionicons
              key={i}
              name="star"
              size={14}
              color={t.colors.warning}
              style={{ marginRight: 2 }}
            />
          ))}
        </View>
        <Text style={{ color: t.colors.textSecondary, marginLeft: 8 }}>
          ({count} {count === 1 ? "review" : "reviews"})
        </Text>
      </View>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <Text className="mb-3" style={{ color: t.colors.textSecondary }}>
          {emptyText}
        </Text>
      ) : (
        <View className="mb-4">
          {reviews.map((r, idx) => (
            <ReviewItem
              key={r._id || String(idx)}
              review={r}
              showDivider={idx !== reviews.length - 1}
            />
          ))}
        </View>
      )}

      {/* Add form */}
      {allowAdd && onSubmit ? (
        <AddReviewForm onSubmit={onSubmit} submitting={submitting} />
      ) : null}
    </View>
  );
}