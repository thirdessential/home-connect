import { useEffect, useRef } from "react";
import { Animated, DimensionValue, StyleSheet, View } from "react-native";

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: object;
};

const Skeleton = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style = {},
}: SkeletonProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.skeleton,
        { width: width as DimensionValue, height, borderRadius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    position: "relative",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    width: 100,
    transform: [{ skewX: "-20deg" }],
  },
});

export default Skeleton;
