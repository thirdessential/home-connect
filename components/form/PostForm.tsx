import { pickImageCropped } from "@/lib/ImagePicker";
import { uploadToBackend } from "@/lib/backendUpload";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ActionButton from "../inputs/ActionButton";
import TextArea from "../inputs/TextArea";

const MAX_IMAGES = 6;

type UploadStatus = "uploading" | "success" | "failed";
type PickedImage = { localUri: string; status: UploadStatus; url?: string };

export default function PostForm({
  onSubmit,
}: {
  onSubmit: (data: { text: string; images: string[] }) => void;
}) {
  const t = useTheme();
  const [text, setText] = useState("");
  const [images, setImages] = useState<PickedImage[]>([]);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    return () => {
      setText("");
      setImages([]);
      setError(undefined);
    };
  }, []);

  const handleChangeText = useCallback((val: string) => {
    setText(val);
    if (val.trim()) setError(undefined);
  }, []);

  // Pick → upload to the existing backend uploader (POST /api/media/upload,
  // same pattern as ResidentProofStep) — never Cloudinary, never a bare
  // file:// URI. Only a successful backend URL is ever sent to createFeed.
  const handleAddImage = useCallback(async (source: "camera" | "library") => {
    if (images.length >= MAX_IMAGES) return;
    const asset = await pickImageCropped(source, { quality: 0.85 });
    if (!asset?.uri) return;

    const localUri = asset.uri;
    setImages((prev) => [...prev, { localUri, status: "uploading" }]);
    try {
      const url = await uploadToBackend(localUri);
      setImages((prev) =>
        prev.map((i) => (i.localUri === localUri ? { ...i, status: "success", url } : i)),
      );
    } catch {
      setImages((prev) =>
        prev.map((i) => (i.localUri === localUri ? { ...i, status: "failed" } : i)),
      );
    }
  }, [images.length]);

  const handleRetry = useCallback(async (localUri: string) => {
    setImages((prev) =>
      prev.map((i) => (i.localUri === localUri ? { ...i, status: "uploading" } : i)),
    );
    try {
      const url = await uploadToBackend(localUri);
      setImages((prev) =>
        prev.map((i) => (i.localUri === localUri ? { ...i, status: "success", url } : i)),
      );
    } catch {
      setImages((prev) =>
        prev.map((i) => (i.localUri === localUri ? { ...i, status: "failed" } : i)),
      );
    }
  }, []);

  const handleRemoveImage = useCallback((localUri: string) => {
    setImages((prev) => prev.filter((i) => i.localUri !== localUri));
  }, []);

  const uploading = images.some((i) => i.status === "uploading");
  const hasFailed = images.some((i) => i.status === "failed");

  const handleSubmit = useCallback(() => {
    if (!text.trim()) {
      setError("Please enter some text for your post.");
      return;
    }
    if (uploading) return; // defensive — button is disabled, but guard anyway
    const uploadedUrls = images.filter((i) => i.status === "success").map((i) => i.url!);
    onSubmit({ text, images: uploadedUrls });
    setText("");
    setImages([]);
    setError(undefined);
  }, [text, images, uploading, onSubmit]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 200 : 100}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextArea
          label="Post Content"
          value={text}
          onChangeText={handleChangeText}
          lines={4}
          maxLength={300}
          error={error}
          containerStyle={styles.textAreaContainer}
          placeholder="What's on your mind? Share an update, a question, or a simple thought..."
        />

        <View style={styles.imageRow}>
          {images.map((img) => (
            <View key={img.localUri} style={[styles.tile, { borderColor: t.colors.border }]}>
              <Image source={{ uri: img.localUri }} style={styles.tileImage} />
              {img.status === "uploading" && (
                <View style={styles.tileOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              {img.status === "failed" && (
                <TouchableOpacity style={styles.tileOverlay} onPress={() => handleRetry(img.localUri)}>
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveImage(img.localUri)}
              >
                <Ionicons name="close-circle" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < MAX_IMAGES && (
            <View style={styles.addRow}>
              <TouchableOpacity
                onPress={() => handleAddImage("library")}
                style={[styles.addTile, { borderColor: t.colors.border }]}
              >
                <Ionicons name="image-outline" size={20} color={t.colors.primary} />
                <Text style={[styles.addText, { color: t.colors.textSecondary }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAddImage("camera")}
                style={[styles.addTile, { borderColor: t.colors.border }]}
              >
                <Ionicons name="camera-outline" size={20} color={t.colors.primary} />
                <Text style={[styles.addText, { color: t.colors.textSecondary }]}>Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {hasFailed && (
          <Text style={styles.failedHint}>Some images failed to upload — tap Retry.</Text>
        )}

        <ActionButton
          title={uploading ? "Uploading…" : "Post to Community"}
          onPress={handleSubmit}
          variant="primary"
          size="md"
          fullWidth
          disabled={uploading}
          loading={uploading}
          containerStyle={styles.submitButton}
          textStyle={styles.submitButtonText}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  textAreaContainer: {
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
  },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  tile: { width: 88, height: 88, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  tileImage: { width: "100%", height: "100%" },
  tileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "#fff", fontSize: 11, fontWeight: "600", marginTop: 2 },
  removeBtn: { position: "absolute", top: 3, right: 3 },
  addRow: { flexDirection: "row", gap: 10 },
  addTile: {
    width: 88,
    height: 88,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addText: { fontSize: 11, fontWeight: "600" },
  failedHint: { color: "#DC2626", fontSize: 12, marginBottom: 8 },
  submitButton: {
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
