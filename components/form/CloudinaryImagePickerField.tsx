// Placeholder: implement this in your cloudinary helper
import { deleteImage } from "@/lib/cloudinary";
import { pickImageCropped } from "@/lib/ImagePicker";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../theme/theme";
import { Card } from "../UI/Card";

interface CloudinaryImagePickerFieldProps {
  label?: string;
  value: string[];
  onChange: (images: string[]) => void;
  max?: number;
  style?: any;
  tileSize?: number;
  disabled?: boolean;
}

function CloudinaryImagePickerField({
  label = "Photos",
  value,
  onChange,
  max = 6,
  style,
  tileSize = 96,
  disabled = false,
}: CloudinaryImagePickerFieldProps) {
  const t = useTheme();
  // Remove upload logic from picker field; parent handles upload
  const [error, setError] = useState<string | null>(null);

  const handleAddImage = useCallback(
    async (source: "camera" | "library") => {
      if (disabled) return;
      setError(null);
      try {
        const asset = await pickImageCropped(source, { quality: 0.85 });
        if (!asset?.uri) return;
        // Only add local URI, do not upload
        onChange([...value, asset.uri]);
      } catch {
        // Error handled by setError above
      }
    },
    [disabled, value, onChange]
  );

  // Extracts the Cloudinary public ID from a full URL
  function extractCloudinaryPublicId(url: string): string | null {
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/myimage.jpg
    // Should return: folder/myimage (without extension)
    try {
      const parts = url.split("/upload/");
      if (parts.length < 2) return null;
      let publicIdWithVersion = parts[1];
      // Remove version if present (e.g., v1234567890/)
      publicIdWithVersion = publicIdWithVersion.replace(/^v\d+\//, "");
      // Remove extension
      return publicIdWithVersion.replace(/\.[a-zA-Z0-9]+$/, "");
    } catch {
      return null;
    }
  }

  const handleRemove = useCallback(
    async (uri: string) => {
      if (disabled) return;
      try {
        const publicId = extractCloudinaryPublicId(uri);
        if (publicId) {
          await deleteImage(publicId);
        }
      } catch (e) {
        // Optionally show error, but still remove from UI
        // Alert.alert('Failed to delete image from storage', e instanceof Error ? e.message : String(e));
      }
      onChange(value.filter((u) => u !== uri));
    },
    [disabled, value, onChange]
  );

  const addTile = useMemo(
    () =>
      value.length < max && (
        <View style={{ width: tileSize, height: tileSize }}>
          <TouchableOpacity
            onPress={() => handleAddImage("library")}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: t.colors.border,
              borderRadius: t.radii.m,
              backgroundColor: t.colors.surfaceAlt,
              alignItems: "center",
              justifyContent: "center",
            }}
            disabled={disabled}
          >
            <Text
              style={{
                color: t.colors.textSecondary,
                fontWeight: "700",
                fontSize: 18,
              }}
            >
              ＋
            </Text>
            <Text
              style={{
                color: t.colors.textSecondary,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              Gallery
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAddImage("camera")}
            disabled={disabled}
            style={{ alignItems: "center", marginTop: 6 }}
          >
            <Text style={{ color: t.colors.brandDark, fontSize: 12, fontWeight: "600" }}>
              Use Camera
            </Text>
          </TouchableOpacity>
        </View>
      ),
    [value.length, max, tileSize, handleAddImage, t, disabled]
  );

  const imageTiles = useMemo(
    () =>
      value.map((uri) => (
        <View
          key={uri}
          style={{
            width: tileSize,
            height: tileSize,
            position: "relative",
          }}
        >
          <Image
            source={{ uri }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: t.radii.m,
            }}
          />
          {!disabled && (
            <TouchableOpacity
              onPress={() => handleRemove(uri)}
              accessibilityLabel="Remove"
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                backgroundColor: "rgba(0,0,0,0.6)",
                borderRadius: 12,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Ionicons name="close-outline" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )),
    [value, tileSize, t, disabled, handleRemove]
  );

  return (
    <Card style={style}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontWeight: "700",
            color: t.colors.textPrimary,
            marginRight: 6,
          }}
        >
          {label}
        </Text>
        <Text style={{ color: t.colors.textSecondary, fontSize: 12 }}>
          ({value.length}/{max})
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {addTile}
        {imageTiles}
      </View>
      {error && (
        <Text style={{ color: t.colors.error, fontSize: 12, marginTop: 6 }}>
          {error}
        </Text>
      )}
    </Card>
  );
}

export default React.memo(CloudinaryImagePickerField);
