import { useImageUploader } from "@/components/image-upload";
import { ImagePickerFieldProps } from "@/types/form.type";
import type { CropRatioKey } from "@/types/imageUpload.type";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../theme/theme";
import { Card } from "../UI/Card";

export default function ImagePickerField({
  label = "Photos",
  mode = "multiple",
  value,
  onChange,
  max,
  quality = 0.85,
  style,
  tileSize = 96,
  disabled = false,
  aspectRatios,
  defaultAspectRatio,
}: ImagePickerFieldProps) {
  const t = useTheme();
  const MAX = max ?? (mode === "single" ? 1 : 6);
  const { openImageUploader } = useImageUploader();

  // Every pick — camera or gallery — goes through the one universal flow
  // (components/image-upload) a single image at a time, so cropping can never
  // be bypassed even in "multiple" mode. The screen's own submit uploads the
  // files, so this field keeps returning local URIs (`upload: false`).
  const addOne = async () => {
    if (disabled) return;
    if (value.length >= MAX) {
      Alert.alert(
        "Limit reached",
        `You can add up to ${MAX} photo${MAX > 1 ? "s" : ""}.`
      );
      return;
    }
    const ratios: CropRatioKey[] = aspectRatios?.length
      ? aspectRatios
      : ["1:1", "4:5", "16:9"];
    const res = await openImageUploader({
      title: label,
      aspectRatios: ratios,
      defaultAspectRatio: defaultAspectRatio ?? ratios[0],
      quality,
      upload: false,
      confirmLabel: "Use Photo",
    });
    if (!res || !("uri" in res)) return;
    const next = mode === "single" ? [res.uri] : [...value, res.uri].slice(0, MAX);
    onChange(next);
  };

  const removeImage = (uri: string) => {
    if (disabled) return;
    onChange(value.filter((u) => u !== uri));
  };

  const Count = () => (
    <Text style={{ color: t.colors.textSecondary, fontSize: 12 }}>
      ({value.length}/{MAX})
    </Text>
  );

  return (
    <Card style={style}>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
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
        <Count />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {/* Add tile */}
        {value.length < MAX && (
          <View style={{ width: tileSize, height: tileSize }}>
            <TouchableOpacity
              onPress={addOne}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`Add ${label}`}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: t.colors.border,
                borderRadius: t.radii.m,
                backgroundColor: t.colors.surfaceAlt,
                alignItems: "center",
                justifyContent: "center",
              }}
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
                Add Photo
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Thumbnails */}
        {value.map((uri) => (
          <View
            key={uri}
            style={{ width: tileSize, height: tileSize, position: "relative" }}
          >
            <Image
              source={{ uri }}
              style={{ width: "100%", height: "100%", borderRadius: t.radii.m }}
            />
            {!disabled && (
              <TouchableOpacity
                onPress={() => removeImage(uri)}
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
                <Text
                  style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}
                >
                  ×
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </Card>
  );
}
