import { DEFAULT_REPORT_REASONS } from "@/assets/mocks/category";
import CTAButton from "@/components/inputs/ActionButton";
import { ReportButtonProps } from "@/types/common.type";
import { useState } from "react";
import { Alert } from "react-native";

export default function ReportButton({
  title,
  message,
  reasons = DEFAULT_REPORT_REASONS,
  iconName = "flag" as const,
  iconColor = "#F44336",
  label = "Report",
  containerStyle,
  loading = false,
  onReport,
}: ReportButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = () => {
    Alert.alert(
      title ?? "Report",
      message ?? "Are you sure you want to report this?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Report",
          onPress: () => {
            // Show report options
            Alert.alert(
              "Report Reason",
              "Please select a reason for reporting",
              [
                ...reasons.map((reason: { id: string; label: string }) => ({
                  text: reason.label,
                  onPress: async () => {
                    setIsSubmitting(true);
                    try {
                      await onReport(reason.label);
                      Alert.alert(
                        "Report Submitted",
                        "Thank you for your report. We will review it shortly."
                      );
                    } catch {
                      Alert.alert(
                        "Error",
                        "Failed to submit report. Please try again."
                      );
                    } finally {
                      setIsSubmitting(false);
                    }
                  },
                })),
                { text: "Cancel", style: "cancel" },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <CTAButton
      title={label}
      onPress={handleReport}
      loading={loading || isSubmitting}
      disabled={loading || isSubmitting}
      variant="outline"
      size="md"
      leftIconName={iconName}
      iconColor={iconColor}
      containerStyle={containerStyle}
    />
  );
}
