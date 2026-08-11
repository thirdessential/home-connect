import { ImagePickerFieldProps } from "@/types/form.type";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../theme/theme";
import { Card } from "../UI/Card";

export default function ImagePickerField({
  label = "Photos",
  mode = "multiple",
  value,
  onChange,
  max,
  allowsEditing = false,
  quality = 0.85,
  style,
  tileSize = 96,
  disabled = false,
}: ImagePickerFieldProps) {
  const t = useTheme();
  const MAX = max ?? (mode === "single" ? 1 : 6);

  const addFromLibrary = async () => {
    if (disabled) return;
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow photo library access.");
        return;
      }
      const remaining = Math.max(0, MAX - value.length);
      if (!remaining) {
        Alert.alert(
          "Limit reached",
          `You can add up to ${MAX} photo${MAX > 1 ? "s" : ""}.`
        );
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: mode === "multiple",
        selectionLimit: mode === "multiple" ? remaining : 1,
        quality,
        allowsEditing,
      });
      if (res.canceled) return;

      const picked = (res.assets ?? [])
        .map((a) => a.uri)
        .filter(Boolean) as string[];
      const next =
        mode === "single"
          ? picked[0]
            ? [picked[0]]
            : []
          : [...value, ...picked].slice(0, MAX);
      onChange(next);
    } catch (e) {
      Alert.alert("Could not open gallery", String(e));
    }
  };

  const addFromCamera = async () => {
    if (disabled) return;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow camera access.");
        return;
      }
      if (value.length >= MAX) {
        Alert.alert(
          "Limit reached",
          `You can add up to ${MAX} photo${MAX > 1 ? "s" : ""}.`
        );
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality,
        allowsEditing,
      });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;

      const next = mode === "single" ? [uri] : [...value, uri].slice(0, MAX);
      onChange(next);
    } catch (e) {
      Alert.alert("Could not open camera", String(e));
    }
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
              onPress={addFromLibrary}
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
                Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={addFromCamera}
              style={{ alignItems: "center", marginTop: 6 }}
            >
              <Text
                style={{
                  color: t.colors.primary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                Use Camera
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
