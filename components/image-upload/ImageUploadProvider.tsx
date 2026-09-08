import { useToast } from "@/components/common/Toast";
import { alertPermissionDenied, pickRawImage } from "@/lib/ImagePicker";
import { uploadToBackend } from "@/lib/backendUpload";
import { ALL_CROP_RATIOS } from "@/lib/imageCrop";
import { validateImage } from "@/lib/imageValidation";
import type {
  CropRatioKey,
  CropResult,
  ImageSourceKind,
  ImageUploadError,
  ImageUploadOutcome,
  ImageUploadResult,
  OpenImageUploader,
  OpenImageUploaderOptions,
  PickedAsset,
  UploadState,
} from "@/types/imageUpload.type";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { InteractionManager, Modal, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ImageCropView from "./ImageCropView";
import ImagePreview from "./ImagePreview";
import ImageSourceSheet from "./ImageSourceSheet";

type Step = "idle" | "source" | "picking" | "crop" | "preview";

type ContextValue = { openImageUploader: OpenImageUploader };

const ImageUploadContext = createContext<ContextValue | undefined>(undefined);

const DEFAULTS = {
  title: "Select Photo",
  quality: 0.85,
  maxDimension: 1440,
  confirmLabel: "Use Photo",
} as const;

/** Best-effort removal of a temporary crop file we created and replaced. */
async function discardTempFile(uri?: string) {
  if (!uri) return;
  try {
    const { File } = await import("expo-file-system");
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Non-fatal — the OS clears the cache directory on its own.
  }
}

/**
 * Hosts the ONE image selection/crop/upload flow for the whole app.
 * Mounted once in app/_layout.tsx; screens call `useImageUploader()`.
 */
export function ImageUploadProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>("idle");
  const [asset, setAsset] = useState<PickedAsset | null>(null);
  const [cropped, setCropped] = useState<CropResult | null>(null);
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });
  const [options, setOptions] = useState<OpenImageUploaderOptions>({});
  // Source the user chose, launched only AFTER the sheet has really closed.
  const [pendingSource, setPendingSource] = useState<ImageSourceKind | null>(null);

  const resolverRef = useRef<((v: ImageUploadOutcome) => void) | null>(null);
  const optionsRef = useRef<OpenImageUploaderOptions>({});
  // Guards against a second upload being fired while one is in flight.
  const uploadingRef = useRef(false);

  const ratios: CropRatioKey[] = options.aspectRatios?.length
    ? options.aspectRatios
    : ALL_CROP_RATIOS;
  const defaultRatio: CropRatioKey =
    options.defaultAspectRatio && ratios.includes(options.defaultAspectRatio)
      ? options.defaultAspectRatio
      : ratios[0];
  const shouldUpload = options.upload !== false;

  const settle = useCallback((outcome: ImageUploadOutcome) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setStep("idle");
    setAsset(null);
    setCropped(null);
    setPendingSource(null);
    setUpload({ status: "idle" });
    uploadingRef.current = false;
    resolve?.(outcome);
  }, []);

  const fail = useCallback(
    (error: ImageUploadError, { close }: { close: boolean }) => {
      optionsRef.current.onError?.(error);
      showToast(error.message, "error");
      if (close) {
        optionsRef.current.onCancel?.();
        settle(null);
      }
    },
    [showToast, settle],
  );

  const cancel = useCallback(() => {
    const current = cropped?.uri;
    optionsRef.current.onCancel?.();
    settle(null);
    void discardTempFile(current);
  }, [cropped, settle]);

  const openImageUploader = useCallback<OpenImageUploader>(
    (opts = {}) => {
      // A second request while one is open resolves the first as cancelled.
      resolverRef.current?.(null);
      optionsRef.current = opts;
      setOptions(opts);
      setAsset(null);
      setCropped(null);
      setPendingSource(null);
      setUpload({ status: "idle" });
      uploadingRef.current = false;
      setStep("source");
      return new Promise<ImageUploadOutcome>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    [],
  );

  /**
   * Tapping Camera/Gallery only RECORDS the choice and closes the sheet.
   *
   * It must not launch the picker inline: `setStep` is async, so the native
   * camera/gallery Activity would be started while this RN Modal is still
   * mounted and animating out. Android then presents the picker behind the
   * modal's dialog window (or drops its result entirely) and the flow appears
   * to do nothing. The launch happens in the effect below, after the modal is
   * really gone.
   */
  const handleSelectSource = useCallback((source: ImageSourceKind) => {
    setPendingSource(source);
    setStep("picking");
  }, []);

  const runPicker = useCallback(
    async (source: ImageSourceKind) => {
      const outcome = await pickRawImage(source);

      if (outcome.status === "denied") {
        alertPermissionDenied(source);
        optionsRef.current.onError?.({
          code: "permission_denied",
          message: "Permission denied",
        });
        optionsRef.current.onCancel?.();
        settle(null);
        return;
      }
      if (outcome.status === "failed") {
        // A real platform failure — surface it instead of silently reopening.
        fail({ code: "invalid_file", message: outcome.message }, { close: false });
        setStep("source");
        return;
      }
      if (outcome.status === "cancelled") {
        // Clean exit — back to the chooser so the user can try the other source.
        setStep("source");
        return;
      }

      const validation = await validateImage(outcome.asset);
      if (!validation.ok) {
        fail(validation.error, { close: false });
        setStep("source");
        return;
      }

      setAsset(outcome.asset);
      setStep("crop");
    },
    [fail, settle],
  );

  // Launch the native picker once the sheet has unmounted and its dismiss
  // animation has settled. Without this delay the picker never appears.
  //
  // IMPORTANT: this effect must NOT call setPendingSource(null) itself.
  // pendingSource is a dependency, so clearing it here re-runs this same
  // effect (cleanup-then-reschedule) before InteractionManager ever fires,
  // and the cleanup cancels the handle it just scheduled — the picker never
  // launches. pendingSource is already reset by openImageUploader/settle/
  // handleChangePhoto once this step is left, so it doesn't need clearing
  // here.
  useEffect(() => {
    if (step !== "picking" || !pendingSource) return;
    const source = pendingSource;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handle = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(
        () => {
          if (!cancelled) void runPicker(source);
        },
        Platform.OS === "android" ? 320 : 420,
      );
    });

    return () => {
      cancelled = true;
      handle.cancel?.();
      if (timer) clearTimeout(timer);
    };
  }, [step, pendingSource, runPicker]);

  const handleCropped = useCallback(
    async (result: CropResult) => {
      const previous = cropped?.uri;
      const validation = await validateImage(result);
      if (!validation.ok) {
        fail(validation.error, { close: false });
        return;
      }
      setCropped(result);
      setUpload({ status: "idle" });
      setStep("preview");
      if (previous && previous !== result.uri) void discardTempFile(previous);
    },
    [cropped, fail],
  );

  const handlePrimary = useCallback(async () => {
    if (!cropped || uploadingRef.current) return;

    const result: ImageUploadResult = {
      uri: cropped.uri,
      width: cropped.width,
      height: cropped.height,
      ratio: cropped.ratio,
    };

    if (!shouldUpload) {
      optionsRef.current.onUploadSuccess?.(result);
      settle(result);
      return;
    }

    uploadingRef.current = true;
    setUpload({ status: "uploading" });
    try {
      const url = await uploadToBackend(cropped.uri);
      const uploaded: ImageUploadResult = { ...result, url };
      setUpload({ status: "success", url });
      optionsRef.current.onUploadSuccess?.(uploaded);
      settle(uploaded);
    } catch (e) {
      // The cropped file is kept on screen so Retry costs the user nothing.
      const message =
        e instanceof Error && e.message && !/^\s*$/.test(e.message)
          ? "Upload failed. Please check your connection and try again."
          : "Upload failed. Please try again.";
      setUpload({ status: "error", message });
      optionsRef.current.onError?.({ code: "upload_failed", message });
    } finally {
      uploadingRef.current = false;
    }
  }, [cropped, shouldUpload, settle]);

  const handleChangePhoto = useCallback(() => {
    const previous = cropped?.uri;
    setCropped(null);
    setAsset(null);
    setPendingSource(null);
    setUpload({ status: "idle" });
    setStep("source");
    void discardTempFile(previous);
  }, [cropped]);

  const handleRemove = useCallback(() => {
    optionsRef.current.onRemove?.();
    settle({ removed: true });
  }, [settle]);

  const value = useMemo(() => ({ openImageUploader }), [openImageUploader]);

  const fullScreenVisible = step === "crop" || step === "preview";

  return (
    <ImageUploadContext.Provider value={value}>
      {children}

      <ImageSourceSheet
        visible={step === "source"}
        title={options.title ?? DEFAULTS.title}
        allowRemove={options.allowRemove}
        onSelect={handleSelectSource}
        onRemove={handleRemove}
        onClose={cancel}
      />

      <Modal
        visible={fullScreenVisible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          // Android hardware back: step back one screen, never lose more.
          if (step === "preview") {
            if (upload.status === "uploading") return;
            setStep("crop");
          } else {
            setStep("source");
          }
        }}
      >
        {/* RNGH needs its own root inside a RN Modal, otherwise the crop
            pan/pinch gestures are dead on Android. */}
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0B0F14" }}>
          {step === "crop" && asset ? (
            <ImageCropView
              asset={asset}
              ratios={ratios}
              defaultRatio={defaultRatio}
              quality={options.quality ?? DEFAULTS.quality}
              maxDimension={options.maxDimension ?? DEFAULTS.maxDimension}
              onCancel={cancel}
              onCropped={handleCropped}
              onError={(message) => fail({ code: "crop_failed", message }, { close: false })}
            />
          ) : null}

          {step === "preview" && cropped ? (
            <ImagePreview
              result={cropped}
              upload={upload}
              primaryLabel={
                shouldUpload ? "Upload Image" : options.confirmLabel ?? DEFAULTS.confirmLabel
              }
              onPrimary={handlePrimary}
              onChangePhoto={handleChangePhoto}
              onCancel={cancel}
            />
          ) : null}
        </GestureHandlerRootView>
      </Modal>
    </ImageUploadContext.Provider>
  );
}

/**
 * The only API screens need:
 *   const { openImageUploader } = useImageUploader();
 *   const res = await openImageUploader({ aspectRatios: ["1:1"], upload: true });
 */
export function useImageUploader(): ContextValue {
  const ctx = useContext(ImageUploadContext);
  if (!ctx) {
    throw new Error("useImageUploader must be used within an ImageUploadProvider");
  }
  return ctx;
}
