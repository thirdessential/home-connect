import { ALL_CROP_RATIOS, CROP_RATIOS, computeCropRect, cropAndCompress } from "@/lib/imageCrop";
import { useTheme } from "@/theme/theme";
import type { CropRatioKey, CropResult, PickedAsset } from "@/types/imageUpload.type";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const MAX_ZOOM = 6;

type Props = {
  asset: PickedAsset;
  ratios: CropRatioKey[];
  defaultRatio: CropRatioKey;
  quality: number;
  maxDimension: number;
  onCancel: () => void;
  onCropped: (result: CropResult) => void;
  onError: (message: string) => void;
};

/**
 * In-app crop screen. One implementation for every upload point in the app:
 * pan + pinch-to-zoom inside a fixed frame whose shape is the ratio the user
 * picked. The image is never stretched — it is always rendered "cover" and the
 * visible frame is what gets written to disk.
 */
export default function ImageCropView({
  asset,
  ratios,
  defaultRatio,
  quality,
  maxDimension,
  onCancel,
  onCropped,
  onError,
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [ratio, setRatio] = useState<CropRatioKey>(defaultRatio);
  const [busy, setBusy] = useState(false);

  const { width: screenW, height: screenH } = Dimensions.get("window");

  const frame = useMemo(() => {
    const maxW = screenW - 32;
    const maxH = screenH * 0.5;
    const r = CROP_RATIOS[ratio];
    let width = maxW;
    let height = maxW / r;
    if (height > maxH) {
      height = maxH;
      width = maxH * r;
    }
    return { width, height };
  }, [ratio, screenW, screenH]);

  // "cover" fit: the smallest scale at which the image fully covers the frame.
  const baseScale = useMemo(
    () => Math.max(frame.width / asset.width, frame.height / asset.height),
    [frame.width, frame.height, asset.width, asset.height],
  );
  const baseW = asset.width * baseScale;
  const baseH = asset.height * baseScale;

  const zoom = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startZoom = useSharedValue(1);

  const reset = useCallback(() => {
    zoom.value = withTiming(1);
    tx.value = withTiming(0);
    ty.value = withTiming(0);
  }, [zoom, tx, ty]);

  // Switching ratio changes the frame, so any previous pan/zoom is meaningless.
  useEffect(() => {
    zoom.value = 1;
    tx.value = 0;
    ty.value = 0;
  }, [ratio, zoom, tx, ty]);

  const gesture = useMemo(() => {
    const fw = frame.width;
    const fh = frame.height;

    const pan = Gesture.Pan()
      .onStart(() => {
        startX.value = tx.value;
        startY.value = ty.value;
      })
      .onUpdate((e) => {
        const maxX = Math.max(0, (baseW * zoom.value - fw) / 2);
        const maxY = Math.max(0, (baseH * zoom.value - fh) / 2);
        tx.value = Math.min(Math.max(startX.value + e.translationX, -maxX), maxX);
        ty.value = Math.min(Math.max(startY.value + e.translationY, -maxY), maxY);
      });

    const pinch = Gesture.Pinch()
      .onStart(() => {
        startZoom.value = zoom.value;
      })
      .onUpdate((e) => {
        const next = Math.min(Math.max(startZoom.value * e.scale, 1), MAX_ZOOM);
        zoom.value = next;
        const maxX = Math.max(0, (baseW * next - fw) / 2);
        const maxY = Math.max(0, (baseH * next - fh) / 2);
        tx.value = Math.min(Math.max(tx.value, -maxX), maxX);
        ty.value = Math.min(Math.max(ty.value, -maxY), maxY);
      });

    return Gesture.Simultaneous(pan, pinch);
  }, [frame.width, frame.height, baseW, baseH, zoom, tx, ty, startX, startY, startZoom]);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: zoom.value }],
  }));

  const handleConfirm = useCallback(async () => {
    if (busy) return; // guard against double taps
    setBusy(true);
    try {
      const rect = computeCropRect({
        imageWidth: asset.width,
        imageHeight: asset.height,
        frameWidth: frame.width,
        frameHeight: frame.height,
        baseScale,
        zoom: zoom.value,
        tx: tx.value,
        ty: ty.value,
      });
      const result = await cropAndCompress(asset, rect, ratio, { quality, maxDimension });
      onCropped(result);
    } catch {
      onError("We couldn't crop that image. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [
    busy, asset, frame.width, frame.height, baseScale, zoom, tx, ty, ratio,
    quality, maxDimension, onCropped, onError,
  ]);

  const options = ratios.length ? ratios : ALL_CROP_RATIOS;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel">
          <Text style={[t.typography.h5, { color: "#FFFFFF" }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[t.typography.h4, { color: "#FFFFFF" }]}>Crop Photo</Text>
        <TouchableOpacity onPress={reset} accessibilityRole="button" accessibilityLabel="Reset">
          <Ionicons name="refresh" size={t.iconSizes.md} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.stage}>
        <GestureDetector gesture={gesture}>
          <View
            style={[
              styles.frame,
              { width: frame.width, height: frame.height, borderColor: t.colors.brand },
            ]}
          >
            <Animated.View style={[styles.imageWrap, imageStyle]}>
              <Image
                source={{ uri: asset.uri }}
                style={{ width: baseW, height: baseH }}
                resizeMode="cover"
              />
            </Animated.View>
            {/* Rule-of-thirds guides */}
            <View pointerEvents="none" style={styles.guides}>
              <View style={[styles.vLine, { left: "33.33%" }]} />
              <View style={[styles.vLine, { left: "66.66%" }]} />
              <View style={[styles.hLine, { top: "33.33%" }]} />
              <View style={[styles.hLine, { top: "66.66%" }]} />
            </View>
          </View>
        </GestureDetector>

        <Text style={[t.typography.caption, styles.hint]}>
          Pinch to zoom · Drag to reposition
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.ratioRow}>
          {options.map((key) => {
            const active = key === ratio;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setRatio(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Crop ratio ${key}`}
                style={[
                  styles.ratioChip,
                  {
                    backgroundColor: active ? t.colors.brand : "rgba(255,255,255,0.12)",
                    borderColor: active ? t.colors.brand : "rgba(255,255,255,0.25)",
                  },
                ]}
              >
                <Text
                  style={[
                    t.typography.label,
                    { color: active ? t.colors.onBrand : "#E5E7EB" },
                  ]}
                >
                  {key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Confirm crop"
          style={[
            styles.primaryBtn,
            { backgroundColor: busy ? t.colors.disabled : t.colors.brand },
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[t.typography.button1, { color: "#FFFFFF" }]}>Confirm Crop</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0F14" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  frame: {
    overflow: "hidden",
    borderWidth: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  imageWrap: { alignItems: "center", justifyContent: "center" },
  guides: { ...StyleSheet.absoluteFill },
  vLine: { position: "absolute", top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.35)" },
  hLine: { position: "absolute", left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.35)" },
  hint: { color: "#9CA3AF", marginTop: 14 },
  footer: { paddingHorizontal: 16, paddingBottom: 8 },
  ratioRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 16 },
  ratioChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 68,
    alignItems: "center",
  },
  primaryBtn: { height: 50, borderRadius: 999, alignItems: "center", justifyContent: "center" },
});
