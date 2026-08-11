import { PROFILE_CONSTANTS } from "@/assets/constants/profile.constant";
import RobustImage from "@/components/UI/RobustImage";
import { pickImageWithMenu } from "@/lib/ImagePicker";
import { isValidImageUrl, sanitizeImageUrl } from "@/lib/imageUtils";
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
}: {
  uri?: string;
  mode?: "view" | "upload" | "edit";
  onChange?: (uri: string) => void;
  size?: number;
  loading?: boolean;
}) {
  const pickImage = async () => {
    const res = await pickImageWithMenu(
      { allowsEditing: true, aspect: [1, 1], quality: 0.9 },
      { allowRemove: true }
    );
    if (!res?.removed && res?.asset?.uri) {
      onChange?.(res.asset.uri);
    }
  };

  const showEditIcon = mode !== "view";

  // Validate and sanitize the URI before rendering
  const validatedUri = isValidImageUrl(uri) ? sanitizeImageUrl(uri) : undefined;

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
            // Use RobustImage for better error handling, auto-retry, and fallback
            // Validates and sanitizes URI using imageUtils
            <RobustImage
              uri={validatedUri}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
              }}
              resizeMode="cover"
              fallbackIcon="person-circle-outline"
              fallbackBackgroundColor="#e5e7eb"
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
                right: 24,
                bottom: 10,
                backgroundColor: "#111827",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
                opacity: 0.9,
              }}
            >
              <Ionicons name="camera-outline" size={14} color="#fff" />
              <Text style={{ color: "#fff", marginLeft: 4, fontSize: 12 }}>
                {PROFILE_CONSTANTS.PROFILE_EDIT_PHOTO}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
