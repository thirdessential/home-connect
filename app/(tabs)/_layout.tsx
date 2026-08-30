import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import { verificationStatus } from "@/assets/enums/common.enum";
import GlobalBottomNavigation from "@/components/UI/GlobalBottomNavigation";
import FormSheetModal from "@/components/modals/FormSheetModal";
import { useCreatePostModal } from "@/hooks/useCreatePostModal";
import { usePermissions } from "@/hooks/usePermissions";
import { useUiStore } from "@/store/useUiStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import { Tabs, router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Custom tab bar with equal spacing */
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const modalOpen = useUiStore((s) => s.createPostModal.visible);
  const { close } = useCreatePostModal();
  const BTN_SIZE = 56;
  // Only subscribe to needed user fields
  const userStatus = useUserStore(
    (state) => state.user?.isAddressVerified?.status,
  );
  const [unverifiedModalVisible, setUnverifiedModalVisible] = useState(false);
  const isUserAllowed = usePermissions().isUserAllowed;

  // Memoize role checks and colors
  const isPending = useMemo(
    () => userStatus === verificationStatus.PENDING,
    [userStatus],
  );
  const isRejected = useMemo(
    () => userStatus === verificationStatus.REJECTED,
    [userStatus],
  );

  // Memoize tab labels
  const tabLabels = useMemo(
    () => [
      COMMON_CONSTANTS.HOME,
      COMMON_CONSTANTS.BUSINESS,
      COMMON_CONSTANTS.DIRECTORY,
      COMMON_CONSTANTS.PROFILE,
    ],
    [isPending],
  );

  // Memoize tab icons
  const tabIcons = useMemo(
    () =>
      [
        state.index === 0 ? "home" : "home-outline",
        state.index === 1 ? "pricetag" : "pricetag-outline",
        state.index === 2 ? "call" : "call-outline",
        state.index === 3 ? "person" : "person-outline",
      ] as const,
    [state.index],
  );

  const handleCloseUnverifiedModal = useCallback(() => {
    setUnverifiedModalVisible(false);
  }, []);

  // Memoize tab handlers
  const handleHomePress = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "home" }] }),
    );
  }, [navigation]);
  const handleBusinessPress = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "business" }] }),
    );
  }, [navigation]);
  const handleDirectoryPress = useCallback(() => {
    navigation.navigate("directory");
  }, [navigation]);
  const handleProfilePress = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "profile" }] }),
    );
  }, [navigation]);

  // Fix bottom bar height for Android and iOS
  const tabBarHeight = insets.bottom + 56; // 56 is a good default for both platforms
  const activeKey = ["home", "business", "directory", "profile"][state.index] ?? "home";
  const handleCenterPress = useCallback(() => {
    // The old CreatePostModal popup is only reachable now from within the
    // new full-screen Create page (Event/Poll/Business handoff) — Plus opens
    // that page directly instead of the modal.
    if (isUserAllowed) setUnverifiedModalVisible(true);
    else if (modalOpen) close();
    else router.push("/(shared)/create");
  }, [isUserAllowed, modalOpen, close]);

  return (
    <>
      <GlobalBottomNavigation
        activeKey={activeKey}
        centerIcon={modalOpen ? "close" : "add"}
        onCenterPress={handleCenterPress}
        items={[
          { key: "home", label: tabLabels[0], icon: tabIcons[0], onPress: handleHomePress },
          { key: "business", label: tabLabels[1], icon: tabIcons[1], onPress: handleBusinessPress },
          { key: "directory", label: tabLabels[2], icon: tabIcons[2], onPress: handleDirectoryPress },
          { key: "profile", label: tabLabels[3], icon: tabIcons[3], onPress: handleProfilePress },
        ]}
      />
      {unverifiedModalVisible && (
        <FormSheetModal
          visible={unverifiedModalVisible}
          onClose={handleCloseUnverifiedModal}
          title={
            isRejected
              ? COMMON_CONSTANTS.ACCOUNT_REJECTED
              : COMMON_CONSTANTS.VERIFICATION_PENDING
          }
          subtitle={
            isRejected
              ? COMMON_CONSTANTS.CONTACT_SUPPORT_REJECTION
              : COMMON_CONSTANTS.WAIT_FOR_ADMIN_APPROVAL
          }
        >
          <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
            <Text
              style={{
                ...t.typography.body,
                color: t.colors.textSecondary,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {isRejected
                ? COMMON_CONSTANTS.REJECTION_MESSAGE
                : COMMON_CONSTANTS.VERIFICATION_MESSAGE}
            </Text>
          </View>
        </FormSheetModal>
      )}
    </>
  );
}

export default function TabsLayout() {
  return (
    <>

      <Tabs
        screenOptions={{ headerShown: true }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen
          name="home"
          options={{ title: COMMON_CONSTANTS.HOME, headerShown: false }}
        />
        <Tabs.Screen
          name="business"
          options={{ title: COMMON_CONSTANTS.BUSINESS, headerShown: false }}
        />
        <Tabs.Screen
          name="directory"
          options={{ title: COMMON_CONSTANTS.DIRECTORY, headerShown: false }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: COMMON_CONSTANTS.PROFILE, headerShown: false }}
        />
      </Tabs>
    </>

  );
}
