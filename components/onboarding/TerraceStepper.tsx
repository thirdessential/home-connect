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

// `steps`/`currentStep` are kept in the signature so every call site
// (Resident + Business onboarding) needs no change — the step-count/progress
// UI is hidden app-wide per product requirement; internal step navigation in
// each screen is untouched.
function TerraceStepper(_props: Props) {
  return null;
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
