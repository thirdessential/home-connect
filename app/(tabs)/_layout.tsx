import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import { verificationStatus } from "@/assets/enums/common.enum";
import FormSheetModal from "@/components/modals/FormSheetModal";
import { useCreatePostModal } from "@/hooks/useCreatePostModal";
import { usePermissions } from "@/hooks/usePermissions";
import { useUiStore } from "@/store/useUiStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import { Tabs } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Custom tab bar with equal spacing */
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const modalOpen = useUiStore((s) => s.createPostModal.visible);
  const { open, close } = useCreatePostModal();
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

  // Memoize tab colors
  const ACTIVE_TAB_COLOR = "#15803D";
  const tabColors = useMemo(
    () => [
      state.index === 0 ? ACTIVE_TAB_COLOR : t.colors.textSecondary,
      state.index === 1 ? ACTIVE_TAB_COLOR : t.colors.textSecondary,
      state.index === 2 ? ACTIVE_TAB_COLOR : t.colors.textSecondary,
      state.index === 3 ? ACTIVE_TAB_COLOR : t.colors.textSecondary,
    ],
    [state.index, t.colors],
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
        state.index === 0 ? "home-sharp" : "home-sharp",
        state.index === 1 ? "lock-closed-outline" : "lock-closed-outline",
        state.index === 2 ? "book-outline" : "book-outline",
        state.index === 3 ? "person-outline" : "person-outline",
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
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
          height: tabBarHeight,
        }}
      >
        {/* Home */}
        <Pressable
          onPress={handleHomePress}
          style={{ flex: 1, alignItems: "center" }}
        >
          <Ionicons
            name={tabIcons[0]}
            size={t.iconSizes.sm}
            color={tabColors[0]}
          />
          <Text style={{ ...t.typography.iconText, color: tabColors[0] }}>
            {tabLabels[0]}
          </Text>
        </Pressable>
        {/* Business */}
        <Pressable
          onPress={handleBusinessPress}
          style={{ flex: 1, alignItems: "center" }}
        >
          <Ionicons
            name={tabIcons[1]}
            size={t.iconSizes.sm}
            color={tabColors[1]}
          />
          <Text style={{ ...t.typography.iconText, color: tabColors[1] }}>
            {tabLabels[1]}
          </Text>
        </Pressable>
        {/* Middle + / × */}
        <View style={{ width: BTN_SIZE, alignItems: "center" }}>
          {modalOpen && !isUserAllowed && (
            <View
              style={{
                position: "absolute",
                top: -70,
                left: -30,
                right: -30,
                bottom: -30,
                backgroundColor: "rgba(0,0,0,0))",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
                borderRadius: 999,
              }}
            />
          )}
          <Pressable
            onPress={() => {
              if (isUserAllowed) {
                setUnverifiedModalVisible(true);
              } else {
                if (modalOpen) close();
                else open();
              }
            }}
            style={{
              width: BTN_SIZE,
              height: BTN_SIZE,
              borderRadius: BTN_SIZE / 2,
              backgroundColor: t.colors.primary,
              alignItems: "center",
              justifyContent: "center",
              display: "flex",
              position: "absolute",
              left: "50%",
              marginLeft: -BTN_SIZE / 2,
              borderColor: t.colors.surface,
              borderWidth: 4,
              top: -42,
              marginBottom: 20,
              zIndex: 9999,
            }}
          >
            <Ionicons
              name={modalOpen ? "close" : "add"}
              size={t.iconSizes.md}
              color="#fff"
            />
          </Pressable>
        </View>
        {/* Directory */}
        <Pressable
          onPress={handleDirectoryPress}
          style={{ flex: 1, alignItems: "center" }}
        >
          <Ionicons
            name={tabIcons[2]}
            size={t.iconSizes.sm}
            color={tabColors[2]}
          />
          <Text style={{ ...t.typography.iconText, color: tabColors[2] }}>
            {tabLabels[2]}
          </Text>
        </Pressable>
        {/* Profile */}
        <Pressable
          onPress={handleProfilePress}
          style={{ flex: 1, alignItems: "center" }}
        >
          <Ionicons
            name={tabIcons[3]}
            size={t.iconSizes.sm}
            color={tabColors[3]}
          />
          <Text style={{ ...t.typography.iconText, color: tabColors[3] }}>
            {tabLabels[3]}
          </Text>
        </Pressable>
      </View>
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
