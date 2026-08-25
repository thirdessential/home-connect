import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CircularImage from "../form/CircularImage";
import FormSheetModal from "../modals/FormSheetModal";

interface ImageTitleHeaderProps {
  imageUri?: string;
  title: string;
  subtitle?: string;
  imageSize?: number;
  isSameUser?: boolean;
  onImageChange?: (uri: string) => void;
  imageLoading?: boolean;
  imageMode?: "view" | "edit";
  showOptionsMenu?: boolean;
  onReportPost?: () => void;
  onReportUser?: () => void;
  onShare?: () => void;
  onRemovePost?: () => void;
  // Shows a small green checkmark next to the title — used when the poster's
  // identity is verified but withheld from the current (unverified) viewer.
  verified?: boolean;
  // Optional pill label rendered next to the title (e.g. "EVENT").
  badge?: string;
  // "onImage" renders light text for headers drawn over a photo (the event
  // card's hero). "default" follows the theme so the header stays legible on
  // a plain card in both light and dark mode.
  variant?: "default" | "onImage";
}

// Static default functions to prevent re-rendering
const DEFAULT_ON_IMAGE_CHANGE = () => {};

// Static styles to prevent re-creation
const MODAL_CONTENT_STYLE = { paddingVertical: 20, paddingHorizontal: 16 };
const ICON_STYLE = { marginRight: 16 };
const LAST_OPTION_STYLE = { borderBottomWidth: 0 };

// Custom comparison function for React.memo
const areEqual = (
  prevProps: ImageTitleHeaderProps,
  nextProps: ImageTitleHeaderProps
) => {
  return (
    prevProps.imageUri === nextProps.imageUri &&
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.imageSize === nextProps.imageSize &&
    prevProps.imageLoading === nextProps.imageLoading &&
    prevProps.imageMode === nextProps.imageMode &&
    prevProps.showOptionsMenu === nextProps.showOptionsMenu &&
    prevProps.onImageChange === nextProps.onImageChange &&
    prevProps.onReportPost === nextProps.onReportPost &&
    prevProps.onReportUser === nextProps.onReportUser &&
    prevProps.onShare === nextProps.onShare &&
    prevProps.onRemovePost === nextProps.onRemovePost &&
    prevProps.verified === nextProps.verified &&
    prevProps.badge === nextProps.badge &&
    prevProps.variant === nextProps.variant
  );
};

const ImageTitleHeader = React.memo<ImageTitleHeaderProps>(
  ({
    imageUri,
    title,
    subtitle,
    isSameUser,
    imageSize = 44, // w-11 h-11 = 44px
    onImageChange = DEFAULT_ON_IMAGE_CHANGE,
    imageLoading = false,
    imageMode = "view",
    showOptionsMenu = false,
    onReportPost,
    onReportUser,
    onShare,
    onRemovePost,
    verified = false,
    badge,
    variant = "default",
  }) => {
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const { hasRole } = usePermissions();
    const t = useTheme();

    const onImage = variant === "onImage";
    const titleColor = onImage ? "#FEFEFE" : t.colors.textPrimary;
    const subtitleColor = onImage ? "#E3E3E3" : t.colors.textSecondary;
    const optionsIconColor = onImage ? "#FFFFFF" : t.colors.textSecondary;

    const handleOptionsPress = useCallback(() => {
      setOptionsModalVisible(true);
    }, []);

    const handleCloseOptionsModal = useCallback(() => {
      setOptionsModalVisible(false);
    }, []);

    const handleOptionSelect = useCallback(
      (option: string) => {
        setOptionsModalVisible(false);

        switch (option) {
          case "report-post":
            onReportPost?.();
            break;
          case "report-user":
            onReportUser?.();
            break;
          case "share":
            onShare?.();
            break;
          case "remove-post":
            onRemovePost?.();
            break;
        }
      },
      [onReportPost, onReportUser, onShare, onRemovePost]
    );

    // Memoized handlers for each option to prevent re-creation
    const handleReportPostPress = useCallback(
      () => handleOptionSelect("report-post"),
      [handleOptionSelect]
    );
    const handleReportUserPress = useCallback(
      () => handleOptionSelect("report-user"),
      [handleOptionSelect]
    );
    const handleSharePress = useCallback(
      () => handleOptionSelect("share"),
      [handleOptionSelect]
    );

    const handleRemovePostPress = useCallback(
      () => handleOptionSelect("remove-post"),
      [handleOptionSelect]
    );

    // Memoized combined style for last option item
    const lastOptionItemStyle = useMemo(
      () => [styles.optionItem, LAST_OPTION_STYLE],
      []
    );

    return (
      <>
        <View style={styles.container}>
          <View style={[styles.imageWrapper, { borderColor: onImage ? "#fff" : t.colors.border }]}>
          <CircularImage
            uri={imageUri}
            mode={imageMode}
            onChange={onImageChange}
            size={imageSize}
            loading={imageLoading}
          />
          </View>
          
          <View style={styles.textContainer}>
            {/* username class */}
            <View style={styles.usernameRow}>
              <Text
                style={[styles.username, { color: titleColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              {verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color="#22C55E"
                  style={[styles.verifiedIcon, styles.verifiedIconWrap]}
                />
              )}
              {badge && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{badge}</Text>
                </View>
              )}
            </View>
            {/* text-sm text-gray-500 */}
            {subtitle && (
              <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
            )}
          </View>
          {showOptionsMenu && (
            <TouchableOpacity
              onPress={handleOptionsPress}
              style={styles.optionsButton}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={optionsIconColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Options Modal */}
        {showOptionsMenu && optionsModalVisible && (
          <FormSheetModal
            visible={optionsModalVisible}
            onClose={handleCloseOptionsModal}
            title=""
            subtitle=""
          >
            <View style={MODAL_CONTENT_STYLE}>
              <TouchableOpacity
                onPress={handleReportPostPress}
                style={[styles.optionItem, { borderBottomColor: t.colors.border }]}
              >
                <Ionicons
                  name="flag-outline"
                  size={24}
                  color={t.colors.textPrimary}
                  style={ICON_STYLE}
                />
                <Text style={[styles.optionText, { color: t.colors.textPrimary }]}>
                Report Post
              </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReportUserPress}
                style={[styles.optionItem, { borderBottomColor: t.colors.border }]}
              >
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={t.colors.textPrimary}
                  style={ICON_STYLE}
                />
                <Text style={[styles.optionText, { color: t.colors.textPrimary }]}>
                  Report User
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSharePress}
                style={[styles.optionItem, { borderBottomColor: t.colors.border }]}
              >
                <Ionicons
                  name="share-outline"
                  size={24}
                  color={t.colors.textPrimary}
                  style={ICON_STYLE}
                />
                <Text style={[styles.optionText, { color: t.colors.textPrimary }]}>
                  Share
                </Text>
              </TouchableOpacity>
              {(hasRole(UserRole.ADMIN) || isSameUser) && (
                <TouchableOpacity
                  onPress={handleRemovePostPress}
                  style={lastOptionItemStyle}
                >
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color={t.colors.textPrimary}
                    style={ICON_STYLE}
                  />
                  <Text style={[styles.optionText, { color: t.colors.textPrimary }]}>
                    Remove Post
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </FormSheetModal>
        )}
      </>
    );
  },
  areEqual
);

ImageTitleHeader.displayName = "ImageTitleHeader";

const styles = StyleSheet.create({
  // flex gap-3 items-center
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // gap-3 = 12px
    // backdropFilter: 
  },
  imageWrapper:{
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 50
  },
    textContainer: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedIconWrap: { flexShrink: 0 },
  // username class styling
  username: {
    fontWeight: "600",
    fontSize: 15,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  badgePill: {
    marginLeft: 6,
    flexShrink: 0,
    backgroundColor: "#A7F2CD",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgePillText: {
    color: "#002114",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // text-sm text-gray-500
  subtitle: {
    fontSize: 14, // text-sm = 14px
  },
  optionsButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
});

export default ImageTitleHeader;
