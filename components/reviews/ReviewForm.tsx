import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../theme/theme";
import StarPicker from "./StarPicker";

export default function AddReviewForm({
  onSubmit,
  submitting = false,
}: {
  onSubmit: (payload: {
    rating: number;
    comment: string;
  }) => Promise<void> | void;
  submitting?: boolean;
}) {
  const t = useTheme();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  const handleSubmit = async () => {
    const text = comment.trim();
    if (!text) return;
    await onSubmit({ rating, comment: text });
    // reset local state after successful submit
    setRating(5);
    setComment("");
  };

  return (
    <View
      className="rounded-lg p-3"
      style={{
        borderWidth: 1,
        borderColor: t.colors.border,
        backgroundColor: t.colors.surface,
      }}
    >
      <Text
        className="mb-2 font-semibold"
        style={{ color: t.colors.textPrimary, fontSize: 16 }}
      >
        Add Your Review
      </Text>

      {/* rating row */}
      <View className="flex-row items-center mb-2">
        <Text style={{ color: t.colors.textPrimary, marginRight: 8 }}>
          Your Rating:
        </Text>
        <StarPicker value={rating} onChange={setRating} />
      </View>

      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Write your review..."
        placeholderTextColor={t.colors.textSecondary}
        multiline
        className="rounded-md px-3 py-2 mb-3"
        style={{
          borderWidth: 1,
          borderColor: t.colors.border,
          backgroundColor: t.colors.surface,
          color: t.colors.textPrimary,
          minHeight: 120,
          textAlignVertical: "top",
        }}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting || comment.trim().length === 0}
        className="items-center rounded-md py-3"
        style={{
          backgroundColor:
            submitting || comment.trim().length === 0
              ? t.colors.disabled
              : t.colors.primary,
        }}
      >
        <Text className="font-bold" style={{ color: "#fff" }}>
          {submitting ? "Submitting…" : "Submit Review"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
