/**
 * Client-side validation for the universal image upload flow.
 *
 * This is a UX guard only — the backend still validates every upload
 * (see POST /api/media/upload). Never treat a pass here as authorization.
 */
import type {
  PickedAsset,
  ValidationResult,
} from "@/types/imageUpload.type";

/** Formats the app + backend accept. */
export const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

const EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

/** 10 MB — matches the server-side multipart limit. */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Smallest usable source image; anything below is unusable after cropping. */
export const MIN_DIMENSION_PX = 80;

/** Best-effort MIME type for a local file URI. */
export function inferMimeType(uri: string, provided?: string): string {
  if (provided && provided.startsWith("image/")) return provided.toLowerCase();
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME[ext] ?? "image/jpeg";
}

/** Filename the backend will receive, derived from the local URI. */
export function fileNameFromUri(uri: string, fallback = "upload.jpg"): string {
  const raw = uri.split("?")[0].split("/").pop();
  return raw && raw.includes(".") ? raw : fallback;
}

function isSupported(mime: string): boolean {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mime);
}

/**
 * Checks the file is present on disk and reads its size when the platform
 * allows it. Returns `undefined` for size when it cannot be determined —
 * callers must treat that as "unknown", not "zero".
 */
export async function statLocalFile(
  uri: string,
): Promise<{ exists: boolean; size?: number }> {
  try {
    // expo-file-system's object API; guarded because content:// and ph://
    // URIs are not always stat-able.
    const { File } = await import("expo-file-system");
    const file = new File(uri);
    return { exists: file.exists, size: file.size ?? undefined };
  } catch {
    // Cannot stat (remote/content URI or unsupported scheme) — do not block.
    return { exists: true };
  }
}

/**
 * Validates a picked or cropped image before it is processed/uploaded.
 * Returns a user-friendly message; never surfaces raw platform errors.
 */
export async function validateImage(
  asset: Pick<PickedAsset, "uri" | "width" | "height" | "mimeType" | "fileSize">,
): Promise<ValidationResult> {
  if (!asset.uri) {
    return {
      ok: false,
      error: { code: "invalid_file", message: "That image could not be read. Please try another one." },
    };
  }

  const mime = inferMimeType(asset.uri, asset.mimeType);
  if (!isSupported(mime)) {
    return {
      ok: false,
      error: {
        code: "unsupported_format",
        message: "Only JPG, PNG and WebP images can be uploaded.",
      },
    };
  }

  const stat = await statLocalFile(asset.uri);
  if (!stat.exists) {
    return {
      ok: false,
      error: { code: "invalid_file", message: "That image is no longer available on your device." },
    };
  }

  const size = asset.fileSize ?? stat.size;
  if (typeof size === "number" && size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: {
        code: "too_large",
        message: `Image is too large. Please choose one under ${Math.round(
          MAX_FILE_SIZE_BYTES / (1024 * 1024),
        )} MB.`,
      },
    };
  }

  if (
    (asset.width && asset.width < MIN_DIMENSION_PX) ||
    (asset.height && asset.height < MIN_DIMENSION_PX)
  ) {
    return {
      ok: false,
      error: {
        code: "invalid_file",
        message: "That image is too small. Please choose a larger photo.",
      },
    };
  }

  return { ok: true };
}
