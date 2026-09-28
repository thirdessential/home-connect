import { PROFILE_CONSTANTS } from "@/assets/constants/profile.constant";
import RobustImage from "@/components/UI/RobustImage";
import { useImageUploader } from "@/components/image-upload";
import { getInitials } from "@/lib/imageUtils";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

/**
 * CircularImage component - Now powered by RobustImage for better error handling
 * Props:
 * - uri: string | undefined (image url)
 * - mode: "view" | "upload" | "edit"
 * - onChange: (uri: string) => void (called when image is uploaded/edited)
 * - size: number (diameter in px)
 * - loading: boolean (show spinner)
 *
 * Features:
 * - Auto-retry on image load failure (via RobustImage)
 * - Better error handling and fallback icons
 * - Same API as before - no breaking changes
 * - Upload/edit functionality preserved
 */
export default function CircularImage({
  uri,
  mode = "view",
  onChange,
  size = 96,
  loading = false,
  onBeforeOpen,
  name,
}: {
  uri?: string;
  mode?: "view" | "upload" | "edit";
  onChange?: (uri: string) => void;
  size?: number;
  loading?: boolean;
  /** Optional guard checked before the picker opens; return false to block (e.g. show a verification prompt). */
  onBeforeOpen?: () => boolean;
  /** Display name to derive initials from when there's no image (e.g. Directory cards). Omit to keep the default icon fallback. */
  name?: string;
}) {
  const { openImageUploader } = useImageUploader();

  // Profile/avatar images are square, so only 1:1 is offered. The parent keeps
  // owning the upload (its own submit sends the file), hence `upload: false`.
  const pickImage = async () => {
    if (onBeforeOpen && !onBeforeOpen()) return;
    const res = await openImageUploader({
      title: "Profile Photo",
      aspectRatios: ["1:1"],
      defaultAspectRatio: "1:1",
      upload: false,
      confirmLabel: "Use Photo",
      allowRemove: true,
    });
    if (res && "uri" in res) onChange?.(res.uri);
  };

  const showEditIcon = mode !== "view";

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
      }}
    >
      <TouchableOpacity
        disabled={mode === "view"}
        onPress={pickImage}
        style={{ flex: 1 }}
        activeOpacity={0.8}
      >
        <View
          style={{
            borderRadius: 999,
            overflow: "hidden",
            backgroundColor: "#f3f4f6",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            width: size,
            height: size,
          }}
        >
          {/* Show loading spinner if explicitly loading */}
          {loading ? (
            <ActivityIndicator size="small" color="#007bff" />
          ) : (
            // Use RobustImage for better error handling, auto-retry, and fallback.
            // RobustImage itself resolves `uri` via buildImageUrl (base-URL join,
            // absolute passthrough) — CircularImage no longer duplicates that logic.
            <RobustImage
              uri={uri}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
              }}
              resizeMode="cover"
              fallbackIcon="person-circle-outline"
              fallbackBackgroundColor="#e5e7eb"
              fallbackText={name ? getInitials(name) : undefined}
              onError={(error) => {
                console.warn("CircularImage load error:", error);
              }}
            />
          )}

          {/* Edit icon overlay - only show when not loading */}
          {showEditIcon && !loading && (
            <View
              style={{
                position: "absolute",
                right: 20,
                bottom: 10,
                backgroundColor: "#111827",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
                opacity: 0.9,
              }}
            >
              <Ionicons name="camera-outline" size={14} color="#fff" />
              <Text style={{ color: "#fffefe", marginLeft: 4, fontSize: 12, fontFamily: "Manrope_500Medium" }}>
                {PROFILE_CONSTANTS.PROFILE_EDIT_PHOTO}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
