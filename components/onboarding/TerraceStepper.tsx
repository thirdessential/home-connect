import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import { getWidth } from "@/theme/theme";
import { Fragment, memo } from "react";
import { StyleSheet, Text, View } from "react-native";

const CIRCLE_SIZE = getWidth(32);
const LINE_HEIGHT = 2;

type Props = {
  steps: string[];
  /** 1-based index of the current step. Steps before it read as completed. */
  currentStep: number;
};

function TerraceStepper({ steps, currentStep }: Props) {
  return (
    <View style={styles.row}>
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        const filled = isActive || isDone;
        const isLast = i === steps.length - 1;

        return (
          <Fragment key={label}>
            <View style={styles.item}>
              <View
                style={[
                  styles.circle,
                  { backgroundColor: filled ? TERRACE_COLORS.orange : "#E5E7EB" },
                ]}
              >
                {isDone ? (
                  <Text style={styles.circleText}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      { color: filled ? "#fff" : "#6B7280" },
                    ]}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isActive && { color: TERRACE_COLORS.orange, fontWeight: "700" },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>

            {!isLast && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: stepNum < currentStep ? TERRACE_COLORS.orange : "#E5E7EB" },
                ]}
              />
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

export default memo(TerraceStepper);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  item: {
    alignItems: "center",
    gap: 6,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  label: {
    fontSize: 11.5,
    color: TERRACE_COLORS.textMuted,
    fontWeight: "600",
  },
  line: {
    flex: 1,
    height: LINE_HEIGHT,
    borderRadius: LINE_HEIGHT / 2,
    marginTop: CIRCLE_SIZE / 2 - LINE_HEIGHT / 2,
    marginHorizontal: getWidth(6),
  },
});
