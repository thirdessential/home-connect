import { CROP_RATIOS } from "@/lib/imageCrop";
import { useTheme } from "@/theme/theme";
import type { CropResult, UploadState } from "@/types/imageUpload.type";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  result: CropResult;
  upload: UploadState;
  /** Primary action label — "Upload Image" when the flow uploads. */
  primaryLabel: string;
  onPrimary: () => void;
  onChangePhoto: () => void;
  onCancel: () => void;
};

/**
 * Step 3 of the flow: the cropped image is shown but NOT sent anywhere until
 * the user explicitly taps the primary button. Errors keep the cropped image
 * on screen so a retry never loses the user's work.
 */
export default function ImagePreview({
  result,
  upload,
  primaryLabel,
  onPrimary,
  onChangePhoto,
  onCancel,
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const screenW = Dimensions.get("window").width;
  const width = screenW - 32;
  const height = width / CROP_RATIOS[result.ratio];
  const maxHeight = Dimensions.get("window").height * 0.5;

  const uploading = upload.status === "uploading";
  const succeeded = upload.status === "success";
  const failed = upload.status === "error";

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={[t.typography.h5, { color: uploading ? "#6B7280" : "#FFFFFF" }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[t.typography.h4, { color: "#FFFFFF" }]}>Preview</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={styles.stage}>
        <Image
          source={{ uri: result.uri }}
          style={{
            width,
            height: Math.min(height, maxHeight),
            borderRadius: 12,
            backgroundColor: "#000",
          }}
          resizeMode="contain"
        />
        <View style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
          <Ionicons name="crop-outline" size={14} color="#E5E7EB" />
          <Text style={[t.typography.caption, { color: "#E5E7EB" }]}>
            {result.ratio} · {result.width}×{result.height}
          </Text>
        </View>

        {failed ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={16} color={t.colors.error} />
            <Text style={[t.typography.bodySmall, { color: t.colors.error, flex: 1 }]}>
              {upload.message}
            </Text>
          </View>
        ) : null}

        {succeeded ? (
          <View style={styles.errorRow}>
            <Ionicons name="checkmark-circle" size={16} color={t.colors.success} />
            <Text style={[t.typography.bodySmall, { color: t.colors.success }]}>
              Uploaded successfully
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={onPrimary}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
          style={[
            styles.primaryBtn,
            { backgroundColor: uploading ? t.colors.disabled : t.colors.brand },
          ]}
        >
          <Text style={[t.typography.button1, { color: "#FFFFFF" }]}>
            {uploading ? "Uploading..." : failed ? "Retry Upload" : primaryLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onChangePhoto}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Change photo"
          style={[styles.secondaryBtn, { opacity: uploading ? 0.5 : 1 }]}
        >
          <Text style={[t.typography.button1, { color: "#FFFFFF" }]}>Change Photo</Text>
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
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 8,
  },
  footer: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  primaryBtn: { height: 50, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  secondaryBtn: {
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
});
