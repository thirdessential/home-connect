/**
 * Types for the universal image upload flow
 * (Camera/Gallery -> Crop -> Preview -> Upload).
 *
 * Shared by components/image-upload/*, lib/imageValidation.ts and every
 * screen that lets a user attach a photo.
 */

/** Aspect ratios the crop screen can offer. */
export type CropRatioKey = "1:1" | "4:5" | "16:9" | "9:16" ;

/** Where the raw image comes from. */
export type ImageSourceKind = "camera" | "library";

/** A raw, not-yet-cropped image returned by the device picker. */
export type PickedAsset = {
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
};

/** Output of the crop step — always a real file on disk. */
export type CropResult = {
  uri: string;
  width: number;
  height: number;
  ratio: CropRatioKey;
  mimeType: string;
};

/** What a caller gets back once the flow finishes. */
export type ImageUploadResult = {
  /** Local file URI of the cropped + compressed image. */
  uri: string;
  /** Backend URL — only present when the flow performed the upload itself. */
  url?: string;
  width: number;
  height: number;
  ratio: CropRatioKey;
};

/** Caller-visible outcome. `removed` is only possible when `allowRemove`. */
export type ImageUploadOutcome =
  | ImageUploadResult
  | { removed: true }
  | null; // cancelled

/** Steps of the flow — drives which surface is on screen. */
export type ImageUploadStep = "idle" | "source" | "crop" | "preview";

/** Upload lifecycle for the preview step. */
export type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; url: string }
  | { status: "error"; message: string };

export type ImageUploadErrorCode =
  | "permission_denied"
  | "invalid_file"
  | "unsupported_format"
  | "too_large"
  | "crop_failed"
  | "upload_failed";

export type ImageUploadError = {
  code: ImageUploadErrorCode;
  message: string;
};

/** Result of client-side validation before anything is processed/sent. */
export type ValidationResult =
  | { ok: true }
  | { ok: false; error: ImageUploadError };

/** Options a screen passes to `openImageUploader`. */
export type OpenImageUploaderOptions = {
  /** Sheet/crop header title. Defaults to "Select Photo". */
  title?: string;
  /** Ratios offered on the crop screen. Defaults to all three. */
  aspectRatios?: CropRatioKey[];
  /** Ratio selected when the crop screen opens. Defaults to the first allowed. */
  defaultAspectRatio?: CropRatioKey;
  /**
   * When true (default) the preview step uploads through the existing backend
   * media API and resolves with `url`. Set false for screens whose own submit
   * handler sends the file (they keep their existing multipart contract).
   */
  upload?: boolean;
  /** JPEG compression 0..1 applied after crop. Defaults to 0.85. */
  quality?: number;
  /** Longest edge of the saved image in px. Defaults to 1440. */
  maxDimension?: number;
  /** Label of the primary preview button when `upload` is false. */
  confirmLabel?: string;
  /** Adds a "Remove Photo" row to the source sheet. */
  allowRemove?: boolean;
  onUploadSuccess?: (result: ImageUploadResult) => void;
  onRemove?: () => void;
  onCancel?: () => void;
  onError?: (error: ImageUploadError) => void;
};

export type OpenImageUploader = (
  options?: OpenImageUploaderOptions,
) => Promise<ImageUploadOutcome>;
