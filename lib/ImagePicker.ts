/**
 * Low-level device image sources for the universal upload flow.
 *
 * This module ONLY talks to expo-image-picker (permissions + launching the
 * camera/gallery). It deliberately does no cropping: every crop in the app
 * goes through the in-app crop screen (components/image-upload) so the
 * experience and the output ratios are identical everywhere.
 *
 * Screens should never import this directly — use `useImageUploader()`.
 */
import type { ImageSourceKind, PickedAsset } from "@/types/imageUpload.type";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";

export type PickOutcome =
  | { status: "ok"; asset: PickedAsset }
  | { status: "cancelled" }
  | { status: "denied" }
  | { status: "failed"; message: string };

const PERMISSION_COPY: Record<ImageSourceKind, { title: string; body: string }> = {
  camera: {
    title: "Camera permission needed",
    body: "Home Connect needs camera access to take a photo. You can enable it in Settings.",
  },
  library: {
    title: "Photos permission needed",
    body: "Home Connect needs photo access to pick an image. You can enable it in Settings.",
  },
};

/** Shows the standard denial alert with a shortcut to app settings. */
export function alertPermissionDenied(source: ImageSourceKind) {
  const copy = PERMISSION_COPY[source];
  Alert.alert(copy.title, copy.body, [
    { text: "Not now", style: "cancel" },
    { text: "Open Settings", onPress: () => Linking.openSettings() },
  ]);
}

async function ensurePermission(source: ImageSourceKind): Promise<boolean> {
  const perm =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  return perm.granted || perm.status === ImagePicker.PermissionStatus.GRANTED;
}

function toPickedAsset(asset: ImagePicker.ImagePickerAsset): PickedAsset {
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? undefined,
    fileName: asset.fileName ?? undefined,
    fileSize: asset.fileSize ?? undefined,
  };
}

/**
 * Launches the camera or the gallery for a single image. Cropping is never
 * requested from the OS — the in-app crop screen handles it.
 */
export async function pickRawImage(source: ImageSourceKind): Promise<PickOutcome> {
  try {
    const granted = await ensurePermission(source);
    if (!granted) return { status: "denied" };

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: false,
      allowsMultipleSelection: false,
      // Keep the source near-lossless; compression happens once, after crop.
      quality: 1,
      exif: false,
    };

    const res =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (res.canceled || !res.assets?.length) return { status: "cancelled" };
    return { status: "ok", asset: toPickedAsset(res.assets[0]) };
  } catch (e) {
    // A native failure (no camera app, missing module in an outdated build,
    // storage error) must never look like "nothing happened".
    if (__DEV__) console.warn(`[ImagePicker] ${source} launch failed`, e);
    return {
      status: "failed",
      message:
        source === "camera"
          ? "Could not open the camera on this device. Please try Gallery instead."
          : "Could not open your photo gallery. Please try again.",
    };
  }
}
