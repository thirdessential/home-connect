import ActionButton from "@/components/inputs/ActionButton";
import TextArea from "@/components/inputs/TextArea";
import { useProductStore } from "@/store/useBusinessStore";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useUserStore } from "@/store/useUserStore";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type ReportType =
  | "feed"
  | "post"
  | "poll"
  | "event"
  | "business"
  | "deal"
  | "user"
  | "service";

const REPORT_REASONS = {
  feed: [
    { id: "inappropriate", label: "Inappropriate content" },
    { id: "spam", label: "Spam/Misleading" },
    { id: "harassment", label: "Harassment/Abuse" },
    { id: "scam", label: "Scam/Fraud" },
    { id: "illegal", label: "Illegal activity" },
    { id: "other", label: "Other" },
  ],
  post: [
    { id: "inappropriate", label: "Inappropriate content" },
    { id: "spam", label: "Spam/Misleading" },
    { id: "harassment", label: "Harassment/Abuse" },
    { id: "misinformation", label: "Misinformation" },
    { id: "other", label: "Other" },
  ],
  poll: [
    { id: "inappropriate", label: "Inappropriate poll" },
    { id: "spam", label: "Spam" },
    { id: "offensive", label: "Offensive/Disrespectful" },
    { id: "other", label: "Other" },
  ],
  event: [
    { id: "fake", label: "Fake/Misleading event" },
    { id: "spam", label: "Spam" },
    { id: "illegal", label: "Illegal activity" },
    { id: "inappropriate", label: "Inappropriate content" },
    { id: "other", label: "Other" },
  ],
  business: [
    { id: "fake", label: "Fake business" },
    { id: "misleading", label: "Misleading information" },
    { id: "fraud", label: "Fraud/Scam" },
    { id: "quality", label: "Poor quality/Service" },
    { id: "unverified", label: "Unverified claims" },
    { id: "other", label: "Other" },
  ],
  deal: [
    { id: "fake", label: "Fake/Counterfeit product" },
    { id: "misleading", label: "Misleading description" },
    { id: "spam", label: "Spam listing" },
    { id: "quality", label: "Poor quality" },
    { id: "pricing", label: "Unfair pricing" },
    { id: "other", label: "Other" },
  ],
  user: [
    { id: "harassment", label: "Harassment/Abuse" },
    { id: "impersonation", label: "Impersonation" },
    { id: "spam", label: "Spam account" },
    { id: "inappropriate", label: "Inappropriate behavior" },
    { id: "other", label: "Other" },
  ],
  service: [
    { id: "fake", label: "Fake service" },
    { id: "misleading", label: "Misleading information" },
    { id: "scam", label: "Scam" },
    { id: "quality", label: "Poor quality" },
    { id: "unsafe", label: "Unsafe/Unverified" },
    { id: "other", label: "Other" },
  ],
};

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportType: ReportType;
  itemId: string;
  itemName?: string; // Name or title of the item being reported
}

export default function ReportModal({
  visible,
  onClose,
  reportType,
  itemId,
  itemName,
}: ReportModalProps) {
  const t = useTheme();
  const { user: currentUser, reportUser } = useUserStore();
  const { reportFeed } = useFeedsStore();
  const { reportBusiness } = useProductStore();
  const { reportDeal } = useWholesaleDealStore();
  const { reportService } = useDailyHelperStore();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track previous visible state
  const previousVisibleRef = useRef(visible);

  // Reset state only when modal transitions from closed to open (false -> true)
  useEffect(() => {
    // If transitioning from false to true
    if (!previousVisibleRef.current && visible) {
      setSelectedReason(null);
      setCustomReason("");
      setSubmitting(false);
      setSubmitted(false);
      setError(null);
    }
    // Update the ref
    previousVisibleRef.current = visible;
  }, [visible]);

  const reasons = REPORT_REASONS[reportType] || REPORT_REASONS.feed;

  // Determine the final reason to submit (custom reason if "other" is selected, otherwise the selected reason)
  const reasonToSubmit =
    selectedReason === "other" ? customReason : selectedReason || "";

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert("Please select a reason for reporting");
      return;
    }

    if (selectedReason === "other" && !customReason.trim()) {
      alert("Please provide a custom reason");
      return;
    }

    setSubmitting(true);
    try {
      // Call API based on report type
      if (
        reportType === "post" ||
        reportType === "poll" ||
        reportType === "event"
      ) {
        // Feed-related reports use the reportFeed API
        if (!currentUser?._id) {
          throw new Error("User ID not found");
        }
        await reportFeed(itemId, currentUser._id, reasonToSubmit);
      } else if (reportType === "business") {
        if (!currentUser?._id) {
          throw new Error("User ID not found");
        }
        await reportBusiness(itemId, currentUser._id, reasonToSubmit);
      } else if (reportType === "deal") {
        if (!currentUser?._id) {
          throw new Error("User ID not found");
        }
        await reportDeal(itemId, currentUser._id, reasonToSubmit);
      } else if (reportType === "user") {
        if (!currentUser?._id) {
          throw new Error("User ID not found");
        }
        await reportUser(itemId, currentUser._id, reasonToSubmit);
      } else if (reportType === "service") {
        if (!currentUser?._id) {
          throw new Error("User ID not found");
        }
        await reportService(itemId, currentUser._id, reasonToSubmit);
      }

      // Only show success if we reach here without throwing
      setSubmitted(true);

      // Reset and close after showing success
      setTimeout(() => {
        setSubmitted(false);
        setSelectedReason(null);
        setCustomReason("");
        setSubmitting(false);
        onClose();
      }, 1500);
    } catch (error) {
      let message =
        error instanceof Error
          ? error.message
          : "Failed to submit report. Please try again.";

      // Handle specific error cases
      if (message.includes("already reported")) {
        message =
          "You have already reported this item. Thank you for helping keep our community safe.";
      }

      setError(message);
      setSubmitting(false);

      // Don't close modal on error - user can try again or close manually
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setCustomReason("");
    setSubmitted(false);
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          <View
            style={[
              styles.container,
              {
                backgroundColor: t.colors.surface,
                paddingBottom: 16,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={{ width: 24 }} />
              <Text
                style={[styles.headerTitle, { color: t.colors.textPrimary }]}
              >
                Report {reportType}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons
                  name="close"
                  size={24}
                  color={t.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Submitted State */}
            {submitted ? (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                </View>
                <Text
                  style={[styles.successTitle, { color: t.colors.textPrimary }]}
                >
                  Thank you!
                </Text>
                <Text
                  style={[
                    styles.successMessage,
                    { color: t.colors.textSecondary },
                  ]}
                >
                  We have received your report and will review it shortly.
                </Text>
              </View>
            ) : error ? (
              <View style={styles.successContainer}>
                <View style={styles.errorIcon}>
                  <Ionicons name="close-circle" size={64} color="#EF4444" />
                </View>
                <Text
                  style={[styles.successTitle, { color: t.colors.textPrimary }]}
                >
                  Report Failed
                </Text>
                <Text
                  style={[
                    styles.successMessage,
                    { color: t.colors.textSecondary },
                  ]}
                >
                  {error}
                </Text>
                <ActionButton
                  title="Close"
                  onPress={handleClose}
                  size="md"
                  containerStyle={{
                    marginTop: 20,
                    width: "80%",
                    alignSelf: "center",
                  }}
                />
              </View>
            ) : (
              <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingVertical: 8 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Reason Section */}
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: t.colors.textPrimary },
                    ]}
                  >
                    Why are you reporting this?*
                  </Text>

                  {reasons.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reasonButton,
                        {
                          borderColor:
                            selectedReason === reason.id
                              ? t.colors.primary
                              : t.colors.border,
                          backgroundColor:
                            selectedReason === reason.id
                              ? t.colors.lightBackground
                              : t.colors.surface,
                        },
                      ]}
                      onPress={() => setSelectedReason(reason.id)}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor:
                              selectedReason === reason.id
                                ? t.colors.primary
                                : t.colors.border,
                          },
                        ]}
                      >
                        {selectedReason === reason.id && (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: t.colors.primary },
                            ]}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.reasonLabel,
                          { color: t.colors.textPrimary },
                        ]}
                      >
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Details Section */}
                {selectedReason === "other" && (
                  <View style={styles.section}>
                    <TextArea
                      label="Please explain"
                      value={customReason}
                      onChangeText={setCustomReason}
                      placeholder="Provide your reason for reporting..."
                      maxLength={500}
                      lines={2}
                      disabled={submitting}
                    />
                  </View>
                )}

                {/* Info Banner */}
                <View
                  style={[
                    styles.infoBanner,
                    { backgroundColor: t.colors.lightBackground },
                  ]}
                >
                  <Ionicons
                    name="information-circle"
                    size={18}
                    color={t.colors.textSecondary}
                  />
                  <Text
                    style={[styles.infoText, { color: t.colors.textSecondary }]}
                  >
                    We take all reports seriously. Please provide accurate
                    information to help us improve community safety.
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* Footer Buttons */}
            {!submitted && !error && (
              <View style={styles.footer}>
                <ActionButton
                  title="Cancel"
                  onPress={handleClose}
                  disabled={submitting}
                  variant="outline"
                  size="md"
                  containerStyle={styles.footerButton}
                />

                <ActionButton
                  title={submitting ? "Submitting..." : "Submit Report"}
                  onPress={handleSubmit}
                  disabled={
                    submitting ||
                    !selectedReason ||
                    (selectedReason === "other" && !customReason.trim())
                  }
                  loading={submitting}
                  size="md"
                  containerStyle={styles.footerButton}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  container: {
    borderRadius: 12,
    maxHeight: "60%",
    maxWidth: "90%",
    width: "100%",
    height: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  itemText: {
    fontSize: 13,
    flex: 1,
  },
  reasonButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  infoBanner: {
    flexDirection: "row",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 16,
  },
  errorIcon: {
    marginBottom: 16,
    alignSelf: "center",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
  },
  footerButton: {
    flex: 1,
  },
});
