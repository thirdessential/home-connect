import { usePermissions } from "@/hooks/usePermissions";
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
    prevProps.verified === nextProps.verified
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
  }) => {
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const { hasRole } = usePermissions();

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
          <CircularImage
            uri={imageUri}
            mode={imageMode}
            onChange={onImageChange}
            size={imageSize}
            loading={imageLoading}
          />
          <View style={styles.textContainer}>
            {/* username class */}
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{title}</Text>
              {verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color="#22C55E"
                  style={styles.verifiedIcon}
                />
              )}
            </View>
            {/* text-sm text-gray-500 */}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {showOptionsMenu && (
            <TouchableOpacity
              onPress={handleOptionsPress}
              style={styles.optionsButton}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
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
                style={styles.optionItem}
              >
                <Ionicons
                  name="flag-outline"
                  size={24}
                  color="#374151"
                  style={ICON_STYLE}
                />
                <Text style={styles.optionText}>Report Post</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReportUserPress}
                style={styles.optionItem}
              >
                <Ionicons
                  name="person-outline"
                  size={24}
                  color="#374151"
                  style={ICON_STYLE}
                />
                <Text style={styles.optionText}>Report User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSharePress}
                style={styles.optionItem}
              >
                <Ionicons
                  name="share-outline"
                  size={24}
                  color="#374151"
                  style={ICON_STYLE}
                />
                <Text style={styles.optionText}>Share</Text>
              </TouchableOpacity>
              {(hasRole(UserRole.ADMIN) || isSameUser) && (
                <TouchableOpacity
                  onPress={handleRemovePostPress}
                  style={lastOptionItemStyle}
                >
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color="#374151"
                    style={ICON_STYLE}
                  />
                  <Text style={styles.optionText}>Remove Post</Text>
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
  },
  textContainer: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  // username class styling
  username: {
    fontWeight: "600",
    fontSize: 15,
    color: "#1F2937",
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  // text-sm text-gray-500
  subtitle: {
    fontSize: 14, // text-sm = 14px
    color: "#6B7280", // text-gray-500
    marginTop: 2,
  },
  optionsButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionText: {
    fontSize: 16,
    color: "#374151",
  },
});

export default ImageTitleHeader;
