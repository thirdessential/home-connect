import { useTheme } from "@/theme/theme";
import type { ImageSourceKind } from "@/types/imageUpload.type";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  title?: string;
  allowRemove?: boolean;
  onSelect: (source: ImageSourceKind) => void;
  onRemove?: () => void;
  onClose: () => void;
};

/**
 * "Select Photo" bottom sheet — the single entry point for every photo upload
 * in the app. Mirrors the FormSheetModal look (rounded top corners, dim
 * backdrop, safe-area padding) so it feels native to Home Connect.
 */
function ImageSourceSheet({
  visible,
  title = "Select Photo",
  allowRemove = false,
  onSelect,
  onRemove,
  onClose,
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const Row = ({
    icon,
    label,
    hint,
    onPress,
    danger,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    hint: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.row,
        { backgroundColor: t.colors.surfaceAlt, borderRadius: t.radii.l },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: danger ? t.colors.error + "1A" : t.colors.brandWeak },
        ]}
      >
        <Ionicons
          name={icon}
          size={t.iconSizes.md}
          color={danger ? t.colors.error : t.colors.brand}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            t.typography.h5,
            { color: danger ? t.colors.error : t.colors.textPrimary },
          ]}
        >
          {label}
        </Text>
        <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>
          {hint}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={t.iconSizes.sm} color={t.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.colors.surface,
              paddingBottom: insets.bottom + t.spacing.l,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: t.colors.border }]} />

          <View style={styles.header}>
            <Text style={[t.typography.h3, { color: t.colors.textPrimary }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={t.iconSizes.md} color={t.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Row
            icon="camera-outline"
            label="Camera"
            hint="Take a new photo"
            onPress={() => onSelect("camera")}
          />
          <Row
            icon="images-outline"
            label="Gallery"
            hint="Choose from your photos"
            onPress={() => onSelect("library")}
          />
          {allowRemove && onRemove ? (
            <Row
              icon="trash-outline"
              label="Remove Photo"
              hint="Clear the current image"
              onPress={onRemove}
              danger
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    width: "100%",
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});

export default memo(ImageSourceSheet);
