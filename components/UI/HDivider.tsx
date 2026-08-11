import { useTheme } from "@/theme/theme";
import { memo } from "react";
import { View } from "react-native";

const HDivider = memo(function HDivider({
  thickness = 1,
  marginVertical = 16,
}: {
  thickness?: number;
  marginVertical?: number;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        height: thickness,
        width: "100%",
        backgroundColor: t.colors.border,
        marginVertical,
      }}
    />
  );
});

export default HDivider;
