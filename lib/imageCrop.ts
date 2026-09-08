/**
 * Crop + compress pipeline for the universal image upload flow.
 *
 * Runs once per confirmed crop (never per gesture) and always writes a file
 * whose dimensions match the ratio the user selected.
 */
import type { CropRatioKey, CropResult, PickedAsset } from "@/types/imageUpload.type";

/**
 * expo-image-manipulator resolves its native module at import time and THROWS
 * when the installed binary predates the dependency. Loading it lazily keeps
 * that failure inside the crop call (where it becomes a retryable error)
 * instead of tearing down the whole upload provider at bundle evaluation.
 */
async function loadManipulator() {
  const mod = await import("expo-image-manipulator");
  return { ImageManipulator: mod.ImageManipulator, SaveFormat: mod.SaveFormat };
}

/** width / height for every supported ratio. */
export const CROP_RATIOS: Record<CropRatioKey, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

export const ALL_CROP_RATIOS: CropRatioKey[] = ["1:1", "4:5", "16:9", "9:16"];

export type CropRect = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

/**
 * Translates the on-screen crop frame into a rectangle in the ORIGINAL image's
 * pixel space.
 *
 * @param baseScale scale that makes the image "cover" the frame at zoom 1
 * @param zoom      user pinch zoom (>= 1)
 * @param tx/ty     user pan, in screen px, measured from the centred position
 */
export function computeCropRect(params: {
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
  baseScale: number;
  zoom: number;
  tx: number;
  ty: number;
}): CropRect {
  const { imageWidth, imageHeight, frameWidth, frameHeight, baseScale, zoom, tx, ty } = params;
  const totalScale = baseScale * zoom;

  const displayedW = imageWidth * totalScale;
  const displayedH = imageHeight * totalScale;

  // Distance from the image's left/top edge to the frame's left/top edge.
  const offsetX = displayedW / 2 - frameWidth / 2 - tx;
  const offsetY = displayedH / 2 - frameHeight / 2 - ty;

  const width = Math.min(Math.round(frameWidth / totalScale), imageWidth);
  const height = Math.min(Math.round(frameHeight / totalScale), imageHeight);

  return {
    originX: Math.round(clamp(offsetX / totalScale, 0, imageWidth - width)),
    originY: Math.round(clamp(offsetY / totalScale, 0, imageHeight - height)),
    width,
    height,
  };
}

/**
 * Crops to `rect`, then downscales the longest edge to `maxDimension` while
 * preserving the selected ratio, then saves once as JPEG.
 */
export async function cropAndCompress(
  asset: Pick<PickedAsset, "uri">,
  rect: CropRect,
  ratio: CropRatioKey,
  opts: { quality?: number; maxDimension?: number } = {},
): Promise<CropResult> {
  const quality = opts.quality ?? 0.85;
  const maxDimension = opts.maxDimension ?? 1440;

  const { ImageManipulator, SaveFormat } = await loadManipulator();
  const context = ImageManipulator.manipulate(asset.uri).crop(rect);

  // Resize by the longer edge only — the other edge follows, so the output
  // ratio stays exactly what the user picked (no stretching).
  if (rect.width >= rect.height) {
    if (rect.width > maxDimension) context.resize({ width: maxDimension });
  } else if (rect.height > maxDimension) {
    context.resize({ height: maxDimension });
  }

  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: quality, format: SaveFormat.JPEG });

  return {
    uri: saved.uri,
    width: saved.width,
    height: saved.height,
    ratio,
    mimeType: "image/jpeg",
  };
}
