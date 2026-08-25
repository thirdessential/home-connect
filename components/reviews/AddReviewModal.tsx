import TextArea from "@/components/inputs/TextArea";
import { useTheme } from "@/theme/theme";
import { AddReviewModalProps } from "@/types/common.type";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export const AddReviewModal = memo(
  ({
    visible,
    onClose,
    onSubmit,
    businessName = "This Business",
  }: AddReviewModalProps) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async () => {
      if (!comment.trim()) {
        alert("Please write a review before submitting");
        return;
      }

      setIsSubmitting(true);
      try {
        // Call the onSubmit callback with the review data
        onSubmit({
          rating,
          comment: comment.trim(),
        });
        // Reset form
        setComment("");
        setRating(5);
        onClose();
      } catch (error) {
        console.error("Error submitting review:", error);
        alert("Failed to submit review. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }, [comment, rating, onSubmit, onClose]);

    const handleClose = useCallback(() => {
      // Reset form when closing
      setComment("");
      setRating(5);
      onClose();
    }, [onClose]);

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <SafeAreaView
            style={[styles.safeAreaContainer, { paddingTop: insets.top + 2 }]}
            edges={[]}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  backgroundColor: theme.colors.surface,
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textPrimary}
                />
              </Pressable>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Write a Review
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Business Name */}
              <View style={styles.section}>
                <Text
                  style={[
                    styles.businessName,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {businessName}
                </Text>
              </View>

              {/* Rating Section */}
              <View style={styles.section}>
                <Text
                  style={[styles.label, { color: theme.colors.textPrimary }]}
                >
                  Rate your experience
                </Text>
                <View style={styles.ratingButtons}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={40}
                        color={
                          star <= rating
                            ? "#FFB800"
                            : theme.colors.textSecondary
                        }
                      />
                    </Pressable>
                  ))}
                </View>
                <Text
                  style={[
                    styles.ratingLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {rating === 1
                    ? "Poor"
                    : rating === 2
                      ? "Fair"
                      : rating === 3
                        ? "Good"
                        : rating === 4
                          ? "Very Good"
                          : "Excellent"}
                </Text>
              </View>

              {/* Review Comment */}
              <View style={styles.section}>
                <TextArea
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Share your experience with this business..."
                  lines={5}
                  maxLength={500}
                  disabled={isSubmitting}
                  label="Your Review"
                />
              </View>

              {/* Submit Button */}
              <View style={styles.buttonContainer}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity: isSubmitting ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleClose}
                  disabled={isSubmitting}
                  style={[
                    styles.cancelButton,
                    {
                      borderColor: theme.colors.border,
                      opacity: isSubmitting ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    );
  },
  (prev, next) =>
    prev.visible === next.visible &&
    prev.businessName === next.businessName &&
    prev.onClose === next.onClose &&
    prev.onSubmit === next.onSubmit,
);
AddReviewModal.displayName = "AddReviewModal";

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  safeAreaContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1F2937",
  },
  ratingButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: "#15803D",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
});
