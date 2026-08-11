import { usePermissions } from "@/hooks/usePermissions";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FormSheetModal from "../modals/FormSheetModal";

interface TitleHeaderProps {
  title: string;
  subtitle?: string;
  selectedUserRoles?: string[];
  userId?: string;
  onBackPress?: () => void;
  showOptionsMenu?: boolean;
  canRemovePost?: boolean;
  onReportPost?: () => void;
  onReportUser?: () => void;
  onShare?: () => void;
  onRemovePost?: () => void;
  onRemoveUser?: () => void;
  onCancelEvent?: () => void;
  onEditEvent?: () => void;
  onToggleAdminRole?: (userId: string, updatedRoles: string[]) => void;
}

// Static default functions to prevent re-rendering
const DEFAULT_ON_BACK_PRESS = () => {};

// Static styles to prevent re-creation
const MODAL_CONTENT_STYLE = { paddingVertical: 20, paddingHorizontal: 16 };
const ICON_STYLE = { marginRight: 16 };
const LAST_OPTION_STYLE = { borderBottomWidth: 0 };

// Custom comparison function for React.memo
const areEqual = (prevProps: TitleHeaderProps, nextProps: TitleHeaderProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.selectedUserRoles === nextProps.selectedUserRoles &&
    prevProps.userId === nextProps.userId &&
    prevProps.showOptionsMenu === nextProps.showOptionsMenu &&
    prevProps.canRemovePost === nextProps.canRemovePost &&
    prevProps.onBackPress === nextProps.onBackPress &&
    prevProps.onReportPost === nextProps.onReportPost &&
    prevProps.onReportUser === nextProps.onReportUser &&
    prevProps.onShare === nextProps.onShare &&
    prevProps.onRemovePost === nextProps.onRemovePost &&
    prevProps.onRemoveUser === nextProps.onRemoveUser &&
    prevProps.onCancelEvent === nextProps.onCancelEvent &&
    prevProps.onEditEvent === nextProps.onEditEvent &&
    prevProps.onToggleAdminRole === nextProps.onToggleAdminRole
  );
};

const TitleHeader = React.memo<TitleHeaderProps>(
  ({
    title,
    subtitle,
    selectedUserRoles,
    userId,
    onBackPress = DEFAULT_ON_BACK_PRESS,
    showOptionsMenu = false,
    canRemovePost = true,
    onReportPost,
    onReportUser,
    onShare,
    onRemovePost,
    onRemoveUser,
    onCancelEvent,
    onEditEvent,
    onToggleAdminRole,
  }) => {
    const { hasAnyRole } = usePermissions();
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);

    const isSelectedUserAdmin = useMemo(() => {
      if (!selectedUserRoles) return false;
      return selectedUserRoles.includes(UserRole.ADMIN);
    }, [selectedUserRoles]);

    const handleOptionsPress = useCallback(() => {
      setOptionsModalVisible(true);
    }, []);

    const handleCloseOptionsModal = useCallback(() => {
      setOptionsModalVisible(false);
    }, []);

    const handleOptionSelect = useCallback((option: string) => {
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
        case "remove-user":
          onRemoveUser?.();
          break;
        case "cancel-event":
          onCancelEvent?.();
          break;
        case "edit-event":
          onEditEvent?.();
          break;
      }
    }, []);

    // Memoized handlers for each option to prevent re-creation
    const handleReportPostPress = useCallback(
      () => handleOptionSelect("report-post"),
      [handleOptionSelect],
    );
    const handleReportUserPress = useCallback(
      () => handleOptionSelect("report-user"),
      [handleOptionSelect],
    );
    const handleSharePress = useCallback(
      () => handleOptionSelect("share"),
      [handleOptionSelect],
    );

    const handleRemovePostPress = useCallback(
      () => handleOptionSelect("remove-post"),
      [handleOptionSelect],
    );

    const handleRemoveUserPress = useCallback(
      () => handleOptionSelect("remove-user"),
      [handleOptionSelect],
    );

    const handleCancelEvent = useCallback(
      () => handleOptionSelect("cancel-event"),
      [handleOptionSelect],
    );

    const handleEditEvent = useCallback(
      () => handleOptionSelect("edit-event"),
      [handleOptionSelect],
    );

    const handleAdminCreation = useCallback(() => {
      if (userId) {
        // If user is already admin, remove admin role (isAdding = false)
        // If user is not admin, add admin role (isAdding = true)

        const isAdding = !isSelectedUserAdmin;
        const updatedRoles = isAdding
          ? [...(selectedUserRoles ?? []), UserRole.ADMIN]
          : (selectedUserRoles ?? []).filter((role) => role !== UserRole.ADMIN);
        onToggleAdminRole?.(userId, updatedRoles);
      }
      setOptionsModalVisible(false);
    }, [userId, isSelectedUserAdmin, selectedUserRoles, onToggleAdminRole]);

    // Memoized combined style for last option item
    const lastOptionItemStyle = useMemo(
      () => [styles.optionItem, LAST_OPTION_STYLE],
      [],
    );

    return (
      <>
        <View style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backButton}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          {/* Title and Subtitle */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          {/* Options Menu Button */}
          {showOptionsMenu && (
            <TouchableOpacity
              onPress={handleOptionsPress}
              style={styles.optionsButton}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
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
              {onReportPost && (
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
              )}

              {onReportUser && (
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
              )}

              {onShare && (
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
              )}

              {onCancelEvent && (
                <TouchableOpacity
                  onPress={handleCancelEvent}
                  style={styles.optionItem}
                >
                  <Ionicons
                    name="close-outline"
                    size={24}
                    color="#374151"
                    style={ICON_STYLE}
                  />
                  <Text style={styles.optionText}>Cancel Event</Text>
                </TouchableOpacity>
              )}

              {onEditEvent && (
                <TouchableOpacity
                  onPress={handleEditEvent}
                  style={styles.optionItem}
                >
                  <Ionicons
                    name="create-outline"
                    size={24}
                    color="#374151"
                    style={ICON_STYLE}
                  />
                  <Text style={styles.optionText}>Edit Event</Text>
                </TouchableOpacity>
              )}

              {hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]) &&
                onToggleAdminRole &&
                userId && (
                  <TouchableOpacity
                    onPress={handleAdminCreation}
                    style={styles.optionItem}
                  >
                    <Ionicons
                      name="person-outline"
                      size={24}
                      color="#374151"
                      style={ICON_STYLE}
                    />
                    <Text style={styles.optionText}>
                      {!isSelectedUserAdmin
                        ? "Make Society Admin"
                        : "Remove Society Admin"}
                    </Text>
                  </TouchableOpacity>
                )}

              {canRemovePost && onRemovePost && (
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

              {onRemoveUser && (
                <TouchableOpacity
                  onPress={handleRemoveUserPress}
                  style={lastOptionItemStyle}
                >
                  <Ionicons
                    name="people-outline"
                    size={24}
                    color="#374151"
                    style={ICON_STYLE}
                  />
                  <Text style={styles.optionText}>Remove User</Text>
                </TouchableOpacity>
              )}
            </View>
          </FormSheetModal>
        )}
      </>
    );
  },
  areEqual,
);

TitleHeader.displayName = "TitleHeader";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
    fontSize: 18,
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  optionsButton: {
    padding: 8,
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

export default TitleHeader;
