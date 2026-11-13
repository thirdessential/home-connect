import * as Haptics from "expo-haptics";

// Fire-and-forget: never awaited, never throws (unsupported device / web / "reduce haptics" settings).
const fire = (style: Haptics.ImpactFeedbackStyle) => {
  try {
    void Haptics.impactAsync(style).catch(() => {});
  } catch {
    /* no haptics available */
  }
};

export const hapticLight = () => fire(Haptics.ImpactFeedbackStyle.Light);
export const hapticMedium = () => fire(Haptics.ImpactFeedbackStyle.Medium);
