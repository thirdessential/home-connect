import { useTheme } from "@/theme/theme";
import type { ImageCarouselProps } from "@/types/components.type";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
  type ListRenderItemInfo,
} from "react-native";

export default React.memo(function HeroCarousel({
  images,
  height = 200,
  borderRadius,
  style,
  contentFit = "cover",
  showDots = true,
}: ImageCarouselProps) {
  const t = useTheme();
  const { width: winWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(winWidth);
  const [index, setIndex] = useState(0);

  const listRef = useRef<FlatList<string>>(null);

  const imgs = useMemo(() => images?.filter(Boolean) || [], [images]);
  const radius = borderRadius ?? t.radii.l;
  const hasMany = imgs.length > 1;

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / (containerWidth || winWidth));
      if (i !== index) setIndex(i);
    },
    [containerWidth, index, winWidth]
  );

  useEffect(() => {
    const neighbors = [imgs[index + 1], imgs[index - 1]].filter(
      Boolean
    ) as string[];
    neighbors.forEach((uri) => Image.prefetch(uri));
  }, [index, imgs]);

  const renderItem = useCallback(
    ({ item, index: i }: ListRenderItemInfo<string>) => {
      const isNearby = Math.abs(i - index) <= 1;
      if (!isNearby) {
        return (
          <View
            style={[
              styles.placeholder,
              {
                width: containerWidth,
                height,
                backgroundColor: t.colors.surfaceAlt,
              },
            ]}
          />
        );
      }

      return (
        <Image
          source={{ uri: item }}
          style={{ width: containerWidth, height }}
          resizeMode={contentFit}
          // Small fade for nicer appearance on Android
          fadeDuration={150}
        />
      );
    },
    [containerWidth, height, contentFit, index, t.colors.surfaceAlt]
  );

  if (imgs.length === 0) return null;

  if (!hasMany) {
    return (
      <View
        className="overflow-hidden mb-4"
        onLayout={(e) =>
          setContainerWidth(e.nativeEvent.layout.width || winWidth)
        }
        style={{
          borderRadius: radius,
          borderWidth: 1,
          borderColor: t.colors.border,
          backgroundColor: t.colors.surfaceAlt,
          ...((style as object) || {}),
        }}
      >
        <Image
          source={{ uri: imgs[0] }}
          style={{ width: "100%", height }}
          resizeMode={contentFit}
        />
      </View>
    );
  }

  return (
    <View
      className="overflow-hidden mb-4"
      onLayout={(e) =>
        setContainerWidth(e.nativeEvent.layout.width || winWidth)
      }
      style={{
        borderRadius: radius,
        borderWidth: 1,
        borderColor: t.colors.border,
        backgroundColor: t.colors.surfaceAlt,
        ...((style as object) || {}),
      }}
    >
      <FlatList
        ref={listRef}
        data={imgs}
        renderItem={renderItem}
        keyExtractor={(u, i) => `${u}-${i}`}
        horizontal
        pagingEnabled
        snapToInterval={containerWidth}
        decelerationRate="fast"
        snapToAlignment="start"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, i) => ({
          length: containerWidth,
          offset: containerWidth * i,
          index: i,
        })}
        removeClippedSubviews
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
      />

      {showDots && imgs.length > 1 && (
        <View className="absolute bottom-2 left-0 right-0 items-center">
          <View
            className="flex-row rounded-full px-2 py-1"
            style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          >
            {imgs.map((_, i) => (
              <View
                key={i}
                className="mx-0.5"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    i === index ? t.colors.primary : "rgba(255,255,255,0.6)",
                }}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create<{ placeholder: ViewStyle }>({
  placeholder: {
    // Placeholder item view
  },
});
