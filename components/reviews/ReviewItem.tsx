import { formatDate } from "@/lib/dateTime";
import { Text, View } from "react-native";
import { useTheme } from "../../theme/theme";
import CircularImage from "../form/CircularImage";
import { Review } from "./ReviewsBlock";
import Stars from "./Star";

export default function ReviewItem({
  review,
  showDivider = false,
}: {
  review: Review;
  showDivider?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ paddingVertical: 10 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {/* Avatar placeholder */}
        <CircularImage
          uri={review.profilePhotoUrl ?? undefined}
          mode="view"
          size={40}
          loading={false}
        />
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: t.colors.textPrimary, fontWeight: "700" }}>
              {review.userName || "Anonymous"}
            </Text>
            <Stars value={review.rating ?? 0} />
          </View>
          {!!review.createdAt && (
            <Text
              style={{
                color: t.colors.textSecondary,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {formatDate(review.createdAt)}
            </Text>
          )}
          {!!review.comment && (
            <Text style={{ color: t.colors.textPrimary, marginTop: 6 }}>
              {review.comment}
            </Text>
          )}
        </View>
      </View>
      {showDivider && (
        <View
          style={{
            height: 1,
            backgroundColor: t.colors.border,
            marginTop: 12,
          }}
        />
      )}
    </View>
  );
}