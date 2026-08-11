import { BUSINESS_LIMITS } from "@/assets/constants/common.constant";
import { DEAL_STATUS, verificationStatus } from "@/assets/enums/common.enum";
import { BUSINESS_CAT_MOCK } from "@/assets/mocks/category";
import GuestSocietyConfirmation from "@/components/onboarding/GuestSocietyConfirmation";
import { usePermissions } from "@/hooks/usePermissions";
import { useRoleBasedText } from "@/hooks/useRoleBasedText";
import { ManageProfilePayload, User } from "@/store/auth.type";
import { useAuthStore } from "@/store/useAuthStore";
import { useProductStore } from "@/store/useBusinessStore";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import {
  BusinessCategory,
  DailyHelper,
  Product,
  WholesaleDeal,
} from "@/types/business.type";
import { InfoBannerProps, OptionItem } from "@/types/common.type";
import { ActionType, ResourceType } from "@/types/permissions";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BusinessForm, { type BusinessFormData } from "../form/BusinessForm";
import EventForm from "../form/EventForm";
import ManageProfileForm from "../form/ManageProfileForm";
import PollForm from "../form/PollForm";
import PostForm from "../form/PostForm";
import ServiceForm from "../form/ServiceForm";
import WholesaleDealForm from "../form/WholesaleDealForm";
import { Card } from "../UI/Card";

// Optimized card for the options list
const OptionCard = memo(function OptionCard({
  item,
  onPress,
}: {
  item: OptionItem;
  onPress: (path: string) => void;
}) {
  const t = useTheme();
  const onPressItem = useCallback(
    () => onPress(item.path),
    [onPress, item.path],
  );
  return (
    <Pressable disabled={item.disabled} onPress={onPressItem}>
      <Card
        style={[
          styles.card,
          {
            borderColor: item.disabled ? t.colors.border : "transparent",
            opacity: item.disabled ? 0.5 : 1,
          },
        ]}
        KeyId={item.label}
      >
        <Ionicons
          name={item.icon as any}
          size={28}
          color={item.color}
          style={styles.cardIcon}
        />
        <View style={styles.cardTextContainer}>
          <Text style={[styles.cardLabel, { color: t.colors.textPrimary }]}>
            {item.label}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
});

type CreatePostModalProps = {
  visible: boolean;
  onClose: () => void;
  initialForm?:
  | null
  | "post"
  | "poll"
  | "event"
  | "service"
  | "createWholesaleDeal"
  | "createBusiness";
  showBack?: boolean;
};

function CreatePostModal({
  visible,
  onClose,
  initialForm,
  showBack = true,
}: CreatePostModalProps) {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const permissions = usePermissions();
  const createProduct = useProductStore((s) => s.createProduct);
  const userProducts = useProductStore((s) => s.userProducts);
  const createFeed = useFeedsStore((s) => s.createFeed);
  const addFeedOptimistically = useFeedsStore((s) => s.addFeedOptimistically);
  const createDeal = useWholesaleDealStore((s) => s.createDeal);
  const addDealOptimistically = useWholesaleDealStore(
    (s) => s.addDealOptimistically,
  );
  const createService = useDailyHelperStore((s) => s.createDailyHelper);
  const loading = useFeedsStore((s) => s.loading);
  const error = useFeedsStore((s) => s.error);
  const userId = useUserStore((s) => s.user?._id);
  const checkBusinessCreationAuthorization = useUserStore(
    (s) => s.checkBusinessCreationAuthorization,
  );
  const currentUser = useUserStore((s) => s.user);
  const userPhone = useUserStore((s) => s.user?.phone);
  const createUser = useUserStore((s) => s.createUser);
  const setRoles = useAuthStore((s) => s.setRoles);
  const userCity = useSocietyStore((s) => s.selectedSociety?.city);
  const userState = useSocietyStore((s) => s.selectedSociety?.state);
  const userRoles = useUserStore((s) => s.user?.roles);
  const updateUser = useUserStore((s) => s.updateUser);
  const isAddressVerified = useUserStore((s) => s.isAddressVerified);
  const societyId = useSocietyStore((s) => s.selectedSociety?._id);
  const [keyboardOpen, setKeyboardOpen] = useState(false);


  /* ---------------- START KEYBOARD ---------------- */

  useEffect(() => {

    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardOpen(true);
    });

    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOpen(false);
    });

    return () => {
      show.remove();
      hide.remove();
    };

  }, []);

  /* ---------------- END KEYBOARD ---------------- */


  const { getActionText } = useRoleBasedText();
  // if parent wants to open directly into a form (e.g., Manage Profile)
  useEffect(() => {
    if (visible && initialForm) {
      setActiveForm(initialForm as any);
    }
    if (!visible) {
      setActiveForm(null);
      setSocietyConfirmed(false);
      setPendingBusiness(false);
    }
  }, [visible, initialForm]);

  // Compute permission booleans to avoid depending on permissions object identity
  const permissionFlags = useMemo(() => {
    return {
      // canCreateWholesaleDeal: permissions.can(
      //   ActionType.CREATE,
      //   ResourceType.WHOLESALE_DEAL,
      // ),
      canCreateWholesaleDeal: (() => {
        if (!permissions.can(ActionType.CREATE, ResourceType.BUSINESS))
          return false;

      }),
      canCreateBusiness: (() => {
        if (!permissions.can(ActionType.CREATE, ResourceType.BUSINESS))
          return false;
        // Resident with pending address verification cannot create a business yet
        const isResidentOnly =
          permissions.hasRole(UserRole.RESIDENT) &&
          !permissions.hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        if (
          isResidentOnly &&
          isAddressVerified?.status === verificationStatus.PENDING
        )
          return false;
        return true;
      })(),
      canCreateResidentService:
        permissions.can(ActionType.CREATE, ResourceType.POST) &&
        permissions.isResidentVerified,
      canCreateServices: permissions.can(
        ActionType.CREATE,
        ResourceType.DAILY_HELP_SERVICE,
      ),
      canCreateResident: permissions.can(
        ActionType.CREATE,
        ResourceType.RESIDENT,
      ),
      canCreateEvent: permissions.can(ActionType.CREATE, ResourceType.EVENT),
    };
  }, [permissions.roles, permissions.can, isAddressVerified]);

  const options: OptionItem[] = useMemo(() => {
    const actionText = getActionText;
    return [
      {
        icon: "person-add-outline" as const,
        label: actionText("Wholesale Deal", "Create a"),
        path: "createWholesaleDeal",
        subtitle: "Post a bulk or wholesale offer.",
        color: "#7C3AED",
        disabled: !permissionFlags.canCreateWholesaleDeal,
      },
      {
        icon: "business-outline" as const,
        label: actionText("Business"),
        path: "createBusiness",
        subtitle: "Create your business",
        color: "#2563EB",
        disabled: !permissionFlags.canCreateBusiness,
      },
      {
        icon: "people-outline" as const,
        label: actionText("Add a Local Helper / Service"),
        path: "service",
        subtitle:
          "Add a Maid, Cook, Driver, etc or Service to community directory",
        color: "#DC2626",
        disabled: !permissionFlags.canCreateServices,
      },
      {
        icon: "people-outline" as const,
        label: actionText("Resident Account"),
        path: "residentAccount",
        subtitle: "Register as a resident to access resident features.",
        color: "#7C3AED",
        disabled: !permissionFlags.canCreateResident,
      },
      {
        icon: "calendar-outline" as const,
        label: actionText("Organize an Event"),
        path: "event",
        subtitle: "Host a community get-together.",
        color: "#EC4899",
        disabled: !permissionFlags.canCreateEvent,
      },
      {
        icon: "bookmark-outline" as const,
        label: actionText("Post a Query to the Feed"),
        subtitle: "Share updates with your community.",
        path: "post",
        color: "#EC4899",
        disabled: true,
      },
      {
        icon: "stats-chart-outline" as const,
        label: actionText("Create a Poll"),
        subtitle: "Ask the Community a Question.",
        path: "poll",
        color: "#EC4899",
        disabled: true,
      },
    ];
  }, [permissionFlags]);

  const [activeForm, setActiveForm] = useState<
    | null
    | "post"
    | "poll"
    | "event"
    | "service"
    | "residentAccount"
    | "createWholesaleDeal"
    | "createBusiness"
  >(null);
  const [societyConfirmed, setSocietyConfirmed] = useState(false);
  const [pendingBusiness, setPendingBusiness] = useState(false);
  const isGuestUser = permissions.hasOnly([UserRole.GUEST]);

  const infoBanner = useMemo<InfoBannerProps | undefined>(() => {
    if (!isGuestUser) return undefined;
    return {
      type: "info",
      title: "Residency verification required",
      description: (
        <Text>
          Complete your resident profile to continue with{" "}
          <Text style={{ fontWeight: "700" }}>
            Resident/business registration
          </Text>
          . Please note that your residency details will be verified by the
          society admin and may take some time to reflect.
        </Text>
      ),
    };
  }, [isGuestUser]);
  const [submissionState, setSubmissionState] = useState<
    | { type: "idle" }
    | { type: "submitting" }
    | { type: "success"; title: string; subtitle: string }
    | { type: "error"; title: string; subtitle: string }
  >({ type: "idle" });
  const handleOptionPress = useCallback(
    (path: string) => {
      // Guest users who live in the society go directly to resident registration
      if (path === "createBusiness" && isGuestUser) {
        setPendingBusiness(true);
        setActiveForm("residentAccount");
        return;
      }
      if (path === "createBusiness" && userId) {
        // Local session check — only enforce cap for non-admin roles
        const isPrivileged = permissions?.hasAnyRole([
          UserRole.ADMIN,
          UserRole.SUPER_ADMIN,
        ]);
        const currentCount = currentUser?.businessIds?.length ?? 0;
        console.log("Checking business creation authorization", currentUser);
        if (
          !isPrivileged &&
          currentCount >= BUSINESS_LIMITS.MAX_BUSINESSES_PER_USER
        ) {
          setSubmissionState({
            type: "error",
            title: "Business Limit Reached",
            subtitle: `You can only create ${BUSINESS_LIMITS.MAX_BUSINESSES_PER_USER} business${BUSINESS_LIMITS.MAX_BUSINESSES_PER_USER === 1 ? "" : "es"} at this time.`,
          });
          setTimeout(() => setSubmissionState({ type: "idle" }), 3000);
          return;
        }
        checkBusinessCreationAuthorization(userId)
          .then((authCheck) => {
            if (!authCheck.isAuthorized) {
              setSubmissionState({
                type: "error",
                title: "Business Limit Reached",
                subtitle:
                  authCheck.reason ||
                  "You have reached the business limit for your role.",
              });
              setTimeout(() => {
                setSubmissionState({ type: "idle" });
                onClose();
              }, 2500);
            } else {
              setActiveForm(path);
            }
          })
          .catch(() => {
            // Fallback: let user proceed if the check fails
            setActiveForm(path);
          });
      } else if (path === "createWholesaleDeal") {
        const isBusiness = permissions.hasRole(UserRole.BUSINESS);
        const hasPendingBusiness =
          isBusiness &&
          currentUser?.businessIds?.some(
            (p) => p.verificationStatus === verificationStatus.PENDING,
          );
        if (hasPendingBusiness) {
          setSubmissionState({
            type: "error",
            title: "Business Approval Pending",
            subtitle:
              "Your business listing is under review. You can post wholesale deals after your business is approved.",
          });
          setTimeout(() => setSubmissionState({ type: "idle" }), 3500);
          return;
        }
        setActiveForm(path);
      } else if (
        path === "post" ||
        path === "poll" ||
        path === "event" ||
        path === "service" ||
        path === "residentAccount"
      ) {
        setActiveForm(path);
      } else {
        onClose();
        router.navigate(path as any);
      }
    },
    [
      isGuestUser,
      userId,
      userProducts,
      permissions,
      checkBusinessCreationAuthorization,
      onClose,
      router,
    ],
  );
  const handleBack = useCallback(() => {
    // Guest: always go back to GuestSocietyConfirmation
    if (isGuestUser) {
      setSocietyConfirmed(false);
      setPendingBusiness(false);
      setActiveForm(null);
      return;
    }
    setActiveForm(null);
  }, [isGuestUser]);
  const handleClose = useCallback(() => {
    setActiveForm(null);
    setSocietyConfirmed(false);
    setPendingBusiness(false);
    setSubmissionState({ type: "idle" });
    onClose();
  }, [onClose]);

  const handleChangeSociety = useCallback(() => {
    setSocietyConfirmed(false);
    setActiveForm(null);
    setSubmissionState({ type: "idle" });
    onClose();
    router.push("/onboarding/select-society");
  }, [onClose, router]);

  const handleConfirmSociety = useCallback(() => {
    setSocietyConfirmed(true);
    setPendingBusiness(true);
    setActiveForm("residentAccount");
  }, []);

  const handleNotAResident = useCallback(() => {
    setSocietyConfirmed(true);
    setActiveForm("createBusiness");
  }, []);

  const onWholesaleSubmit = useCallback(
    async (wholesaleFormData: Partial<WholesaleDeal>) => {
      const updatedDeal = {
        ...wholesaleFormData,
        _id: `temp-${Date.now()}`, // Temporary ID for optimistic UI
        userId: userId,
        societyId: societyId,
        phone: userPhone,
        dealStatus: DEAL_STATUS.ACTIVE,
        isDealActive: true,
        verificationStatus: {
          status: verificationStatus.APPROVED,
          rejectionReason: null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as WholesaleDeal;

      // Add deal optimistically for immediate UI feedback
      if (societyId && userPhone && userId) {
        addDealOptimistically(updatedDeal);
      }

      // Show success message
      setSubmissionState({
        type: "success",
        title: "Deal created",
        subtitle: "Your wholesale offer was posted.",
      });

      // Close modal after delay
      setTimeout(() => {
        setActiveForm(null);
        setSubmissionState({ type: "idle" });
        onClose();
      }, 1600);

      // Send to backend in background
      if (societyId && userPhone && userId) {
        await createDeal({
          ...wholesaleFormData,
          userId: userId,
          societyId: societyId,
          phone: userPhone,
          dealStatus: DEAL_STATUS.ACTIVE,
          isDealActive: true,
          verificationStatus: {
            status: verificationStatus.APPROVED,
            rejectionReason: null,
          },
        });
      }
    },
    [createDeal, addDealOptimistically, societyId, userId, userPhone, onClose],
  );

  const onBusinessSubmit = useCallback(
    async (businessFormData: BusinessFormData) => {
      const normalizedPhone = businessFormData.businessPhone
        ? businessFormData.businessPhone.startsWith("+")
          ? businessFormData.businessPhone
          : `+91${businessFormData.businessPhone}`
        : undefined;

      const updatedRoles = Array.from(
        new Set(
          [
            ...(Array.isArray(userRoles) ? userRoles : []),
            UserRole.BUSINESS,
          ].filter((r) => r !== "guest"),
        ),
      );

      try {
        // Step 1: Handle user creation or update and get the final user ID
        let finalUserId: string;

        if (
          permissions?.hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]) &&
          businessFormData.businessFor !== "self"
        ) {
          const newUser: Partial<User> = {
            fullName: businessFormData.title,
            phone: normalizedPhone || "",
            societyId: societyId,
            tower: "",
            flatNo: "",
            email: businessFormData.email || "",
            completeAddress: businessFormData.address,
            isAddressVerified: {
              status: verificationStatus.APPROVED,
              rejectionReason: null,
            },
            roles: [UserRole.BUSINESS],
          };
          await createUser(newUser);

          // Get the created/existing user ID from store
          const createdUserId = useUserStore.getState().existingUserId;
          if (!createdUserId) {
            throw new Error("Failed to retrieve user ID after creation");
          }

          finalUserId = createdUserId;
        } else {
          await updateUser(
            {
              roles: updatedRoles,
              societyId: societyId,
              completeAddress: businessFormData.address,
              // isAddressVerified: {
              //   status: verificationStatus.PENDING,
              //   rejectionReason: null,
              // },
            },
            userId!,
          );
          finalUserId = userId!;
        }

        // Step 2: Create business with the confirmed user ID
        const newBusiness: Product = {
          title: businessFormData.title,
          description: businessFormData.description,
          businessPhone: normalizedPhone,
          completeAddress: businessFormData.address,
          images: businessFormData.images || [],
          category: businessFormData.category,
          shopTimings: businessFormData.shopTimings,
          city: userCity || "",
          email: businessFormData.email || "",
          gstNumber: businessFormData.gstNumber || "",
          state: userState || "",
          price: {
            mrp: "0",
            discountPrcnt: "0",
            saveAmount: "0",
            sellingPrice: String(businessFormData.price) || "0",
          },
          phone: normalizedPhone || userPhone,
          userId: finalUserId,
          societyId: societyId,
        };

        if (
          permissions?.hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]) &&
          businessFormData.businessFor === "other"
        ) {
          newBusiness.verificationStatus = {
            status: verificationStatus.APPROVED,
            rejectionReason: null,
          };
        } else {
          newBusiness.verificationStatus = {
            status: verificationStatus.PENDING,
            rejectionReason: null,
          };
        }

        await createProduct(newBusiness);
        setRoles(updatedRoles);

        setSubmissionState({
          type: "success",
          title: "Business created",
          subtitle: "Your business listing is now live.",
        });

        // Close modal after delay
        setTimeout(() => {
          setActiveForm(null);
          setSubmissionState({ type: "idle" });
          onClose();
        }, 1600);
      } catch (error: any) {
        // Show error to user
        setSubmissionState({
          type: "error",
          title: "Error",
          subtitle: error || "Failed to create business. Please try again.",
        });

        // Close modal after delay
        setTimeout(() => {
          setActiveForm(null);
          setSubmissionState({ type: "idle" });
          onClose();
        }, 2500);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      onClose,
      permissions,
      societyId,
      userCity,
      userId,
      userPhone,
      userRoles,
      userState,
    ],
  );

  // Define the onPostSubmit handler
  const onPostSubmit = useCallback(
    async (postFormData: { text: string; images: string[] }) => {
      // Create optimistic feed item with temporary ID
      // Ensure we have user data for immediate rendering
      const optimisticFeed = {
        _id: `temp-${Date.now()}`,
        type: "post" as const,
        content: postFormData.text,
        images: postFormData.images,
        user: currentUser
          ? {
            _id: currentUser._id,
            fullName: currentUser.fullName,
            profilePhotoUrl: currentUser.profilePhotoUrl,
            flatNo: currentUser.flatNo,
            tower: currentUser.tower,
            phone: currentUser.phone,
            roles: currentUser.roles,
          }
          : undefined,
        society: societyId,
        flatNo: currentUser?.flatNo,
        towerName:
          typeof currentUser?.societyId === "object" &&
            currentUser?.societyId !== null
            ? currentUser.societyId.name
            : undefined,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addFeedOptimistically(optimisticFeed);

      // Show success message
      setSubmissionState({
        type: "success",
        title: "Post created",
        subtitle: "Your update was shared with the community.",
      });

      // Close modal after delay
      setTimeout(() => {
        setActiveForm(null);
        setSubmissionState({ type: "idle" });
        onClose();
      }, 1600);

      // Send to backend in background
      const postBody = {
        type: "post" as const,
        content: postFormData.text,
        images: postFormData.images,
        user: userId,
        society: societyId,
        flatNo: currentUser?.flatNo,
        towerName:
          typeof currentUser?.societyId === "object" &&
            currentUser?.societyId !== null
            ? currentUser.societyId.name
            : undefined,
      };
      await createFeed(postBody);
    },
    [
      createFeed,
      addFeedOptimistically,
      currentUser,
      userId,
      societyId,
      onClose,
    ],
  );

  // Helper to build event feed object for both optimistic UI and backend

  // Define the onEventSubmit handler (DRY)
  const onEventSubmit = useCallback(
    async (eventFormData: {
      banner?: string;
      title: string;
      date: string;
      location: string;
      description: string;
      price?: string;
      eventDate?: string;
      eventTime?: string;
      maxParticipants?: string;
      minParticipants?: string;
      regDeadline?: string;
      details?: {
        freeChildren: boolean;
        guests: boolean;
        materials: boolean;
        refreshments: boolean;
      };
    }) => {
      // Create optimistic feed item
      // Ensure we have user data for immediate rendering
      const optimisticFeed = {
        _id: `temp-${Date.now()}`,
        type: "event" as const,
        title: eventFormData.title,
        images: eventFormData.banner
          ? [eventFormData.banner]
          : ["https://images.unsplash.com/photo-1464983953574-0892a716854b"],
        content: eventFormData.description,
        description: `${eventFormData.description ||
          `${eventFormData.eventDate} at ${eventFormData.location}`
          }`,
        user: currentUser
          ? {
            _id: currentUser._id,
            fullName: currentUser.fullName,
            profilePhotoUrl: currentUser.profilePhotoUrl,
            flatNo: currentUser.flatNo,
            tower: currentUser.tower,
            phone: currentUser.phone,
            roles: currentUser.roles,
          }
          : undefined,
        society: societyId,
        flatNo: currentUser?.flatNo,
        towerName:
          typeof currentUser?.societyId === "object" &&
            currentUser?.societyId !== null
            ? currentUser.societyId.name
            : undefined,
        price: eventFormData.price,
        eventDate: eventFormData.eventDate,
        eventTime: eventFormData.eventTime,
        maxParticipants: eventFormData.maxParticipants,
        minParticipants: eventFormData.minParticipants,
        regDeadline: eventFormData.regDeadline,
        location: eventFormData.location || "pune",
        eventDetails: {
          freeChildren: eventFormData.details?.freeChildren || false,
          guests: eventFormData.details?.guests || false,
          materials: eventFormData.details?.materials || false,
          refreshments: eventFormData.details?.refreshments || false,
        },
        likes: [],
        comments: [],
        rsvps: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add feed to UI immediately
      addFeedOptimistically(optimisticFeed);

      // Show success message
      setSubmissionState({
        type: "success",
        title: "Event created",
        subtitle: "Your event has been scheduled.",
      });

      // Close modal after delay
      setTimeout(() => {
        setActiveForm(null);
        setSubmissionState({ type: "idle" });
        onClose();
      }, 1600);

      await createFeed({
        type: "event",
        title: eventFormData.title,
        images: eventFormData.banner ? [eventFormData.banner] : [],
        content: eventFormData.description,
        description: `${eventFormData.description ||
          `${eventFormData.eventDate} at ${eventFormData.location}`
          }`,
        user: userId,
        society: societyId,
        price: eventFormData.price,
        eventDate: eventFormData.eventDate,
        eventTime: eventFormData.eventTime,
        maxParticipants: eventFormData.maxParticipants,
        minParticipants: eventFormData.minParticipants,
        location: eventFormData.location || "pune",
        regDeadline: eventFormData.regDeadline,
        eventDetails: {
          freeChildren: eventFormData.details?.freeChildren || false,
          guests: eventFormData.details?.guests || false,
          materials: eventFormData.details?.materials || false,
          refreshments: eventFormData.details?.refreshments || false,
        },
      });
    },
    [
      createFeed,
      addFeedOptimistically,
      currentUser,
      userId,
      societyId,
      onClose,
    ],
  );

  const onPollSubmit = useCallback(
    async (pollFormData: { question: string; options: BusinessCategory[] }) => {
      // Create optimistic feed item
      // Ensure we have user data for immediate rendering
      const optimisticFeed = {
        _id: `temp-${Date.now()}`,
        type: "poll" as const,
        title: pollFormData.question,
        options: pollFormData.options,
        user: currentUser
          ? {
            _id: currentUser._id,
            fullName: currentUser.fullName,
            profilePhotoUrl: currentUser.profilePhotoUrl,
            flatNo: currentUser.flatNo,
            tower: currentUser.tower,
            phone: currentUser.phone,
            roles: currentUser.roles,
          }
          : undefined,
        society: societyId,
        flatNo: currentUser?.flatNo,
        towerName:
          typeof currentUser?.societyId === "object" &&
            currentUser?.societyId !== null
            ? currentUser.societyId.name
            : undefined,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add feed to UI immediately
      addFeedOptimistically(optimisticFeed);

      // Show success message
      setSubmissionState({
        type: "success",
        title: "Poll created",
        subtitle: "Your question is live for votes.",
      });

      // Close modal after delay
      setTimeout(() => {
        setActiveForm(null);
        setSubmissionState({ type: "idle" });
        onClose();
      }, 1600);

      // Send to backend in background
      const postBody = {
        type: "poll" as const,
        title: pollFormData.question,
        options: pollFormData.options,
        user: userId,
        society: societyId,
        flatNo: currentUser?.flatNo,
        towerName:
          typeof currentUser?.societyId === "object" &&
            currentUser?.societyId !== null
            ? currentUser.societyId.name
            : undefined,
      };
      await createFeed(postBody);
    },
    [
      createFeed,
      addFeedOptimistically,
      currentUser,
      userId,
      societyId,
      onClose,
    ],
  );

  const onServiceSubmit = useCallback(
    async (serviceFormData: Partial<DailyHelper>) => {
      const payload = {
        ...serviceFormData,
        createdBy: userId!,
        societyIds: societyId ? [societyId] : [],
        verificationStatus: {
          status:
            permissions.hasRole(UserRole.GUEST) ||
              permissions.hasOnly([UserRole.BUSINESS])
              ? verificationStatus.PENDING
              : verificationStatus.APPROVED,
          rejectionReason: null,
        },
      };

      try {
        await createService(payload);
        // Fetch all approved daily services after successful creation
        if (
          typeof useDailyHelperStore.getState().getAllApprovedDailyServices ===
          "function" &&
          societyId
        ) {
          await useDailyHelperStore
            .getState()
            .getAllApprovedDailyServices(societyId);
        }
        setSubmissionState({
          type: "success",
          title: "Service added",
          subtitle: "Your service is available in directory.",
        });

        // Close modal after delay
        setTimeout(() => {
          setActiveForm(null);
          setSubmissionState({ type: "idle" });
          onClose();
        }, 1600);
      } catch (error: any) {
        console.error("Error creating service:", error);
        setSubmissionState({
          type: "error",
          title: "Error",
          subtitle:
            error && typeof error === "object" && "message" in error
              ? error.message
              : "Failed to add service. Please try again.",
        });

        // Close modal after delay
        setTimeout(() => {
          setActiveForm(null);
          setSubmissionState({ type: "idle" });
          onClose();
        }, 2500);
      }
    },
    [createService, userId, societyId, permissions, onClose],
  );


  // console.log("activeForm", activeForm)

  // Header title derived once per activeForm change
  const headerTitle = useMemo(() => {
    if (isGuestUser && !societyConfirmed) return "Before we begin...";
    switch (activeForm) {
      case "post":
        return "New Post";
      case "poll":
        return "Create Poll";
      case "event":
        return "Create Event";
      case "service":
        return "Add Service";
      case "createWholesaleDeal":
        return "Create a Wholesale Deal";
      case "createBusiness":
        return "Create a Business Listing";
      case "residentAccount":
        if (permissions?.hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
          return "Add Resident Account";
        if (pendingBusiness) return "Verify Residency";
        return "Update Resident Account";
      default:
        return "Create New";
    }
  }, [activeForm, permissions, isGuestUser, societyConfirmed, pendingBusiness]);

  const onResidentAccountSubmit = useCallback(
    async (payload: ManageProfilePayload) => {
      if (!userId) {
        handleClose();
        return;
      }
      try {
        if (permissions?.hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])) {
          await createUser({
            fullName: payload.fullName,
            phone: `+91${payload.mobileNumber}`,
            societyId: payload.societyId,
            tower: payload.towerId,
            flatNo: payload.flatNo,
            roles: payload.roles,
            email: payload.email,
            completeAddress: payload.completeAddress,
          });
        } else {
          await updateUser(
            {
              fullName: payload.fullName,
              completeAddress: payload.completeAddress,
              societyId: payload.societyId,
              tower: payload.towerId,
              flatNo: payload.flatNo,
              email: payload.email,
              roles: [UserRole.RESIDENT],
              isAddressVerified: {
                status: verificationStatus.PENDING,
                rejectionReason: null,
              },
            },
            userId,
          );
          // Sync auth store so HomeHeader / Profile update immediately
          const updatedRoles = Array.from(
            new Set(
              [
                ...(Array.isArray(userRoles) ? userRoles : []),
                UserRole.RESIDENT,
              ].filter((r) => r !== UserRole.GUEST),
            ),
          );
          setRoles(updatedRoles);
        }
        // Show success message
        setSubmissionState({
          type: "success",
          title: "Profile updated",
          subtitle: "Your resident profile was saved.",
        });

        // Close modal after delay
        setTimeout(() => {
          setActiveForm(null);
          setPendingBusiness(false);
          setSubmissionState({ type: "idle" });
          onClose();
        }, 1600);
      } catch (error: any) {
        const isDuplicateEmail =
          error?.message?.includes("E11000") &&
          error?.message?.includes("email");
        const errorMessage = isDuplicateEmail
          ? "This email is already linked to another account. Please use a different email."
          : error?.message || "Failed to update profile. Please try again.";

        setSubmissionState({
          type: "error",
          title: isDuplicateEmail ? "Email Already Taken" : "Error",
          subtitle: errorMessage,
        });

        if (isDuplicateEmail) {
          // Stay in the form so the user can correct the email
          setTimeout(() => setSubmissionState({ type: "idle" }), 3500);
        } else {
          // For other errors, close the modal after a delay
          setTimeout(() => {
            setActiveForm(null);
            setSubmissionState({ type: "idle" });
            onClose();
          }, 2500);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, userRoles, setRoles],
  );

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : keyboardOpen ? 'height' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdrop}>
              <TouchableOpacity
                style={styles.backdropTouchable}
                activeOpacity={1}
                onPress={handleClose}
              />
              {/* Success/Error overlay — placed at backdrop level to cover full screen */}
              {submissionState.type !== "idle" && (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: "rgba(0,0,0,0.6)",
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 1000,
                    },
                  ]}
                >
                  <View
                    style={{
                      backgroundColor: t.colors.surface,
                      borderRadius: 16,
                      padding: 24,
                      minWidth: 280,
                      maxWidth: "80%",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 16,
                        backgroundColor:
                          submissionState.type === "success"
                            ? "#DCFCE7"
                            : "#FEE2E2",
                      }}
                    >
                      <Ionicons
                        name={
                          submissionState.type === "success"
                            ? "checkmark"
                            : "close"
                        }
                        size={40}
                        color={
                          submissionState.type === "success"
                            ? "#16A34A"
                            : "#EF4444"
                        }
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "700",
                        color: t.colors.textPrimary,
                        marginBottom: 8,
                        textAlign: "center",
                      }}
                    >
                      {(submissionState.type === "success" ||
                        submissionState.type === "error") &&
                        submissionState.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: t.colors.textSecondary,
                        textAlign: "center",
                      }}
                    >
                      {(submissionState.type === "success" ||
                        submissionState.type === "error") &&
                        submissionState.subtitle}
                    </Text>
                  </View>
                </View>
              )}
              <View
                style={[
                  styles.modalContainer,
                  {
                    backgroundColor: t.colors.surface,
                    paddingBottom: insets.bottom + 16,
                  },
                ]}
              >
                {/* Header with close/back */}
                
                {/* {console.log(headerTitle)} */}
                {/* {headerTitle !== "Create a Wholesale Deal" &&  */}
                <View style={styles.headerRow}>
                  {activeForm && showBack ? (
                    <TouchableOpacity
                      onPress={handleBack}
                      style={{ marginRight: 8 }}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={24}
                        color={t.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ) : null}
                  <Text
                    style={[
                      styles.headerText,
                      { color: t.colors.textPrimary },
                    ]}
                  >
                    {headerTitle}
                  </Text>
                  <TouchableOpacity onPress={handleClose}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={t.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {/* } */}

                {/* Main content: either options or form */}
                {isGuestUser && !societyConfirmed && (
                  <GuestSocietyConfirmation
                    onConfirm={handleConfirmSociety}
                    onChangeSociety={handleChangeSociety}
                    onNotAResident={handleNotAResident}
                  />
                )}

                {(!isGuestUser || societyConfirmed) && !activeForm && (
                  <ScrollView
                    style={styles.optionsScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    bounces={false}
                  >
                    {options.map((item) => (
                      <OptionCard
                        key={item.path}
                        item={item}
                        onPress={handleOptionPress}
                      />
                    ))}
                  </ScrollView>
                )}

                {activeForm === "createWholesaleDeal" && (
                  <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <WholesaleDealForm onSubmit={onWholesaleSubmit} />
                  </ScrollView>
                )}

                {activeForm === "createBusiness" && (
                  <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <BusinessForm
                      onSubmit={onBusinessSubmit}
                      categories={BUSINESS_CAT_MOCK}
                    />
                  </ScrollView>
                )}

                {activeForm === "post" && (
                  <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <PostForm onSubmit={onPostSubmit} />
                  </ScrollView>
                )}

                {activeForm === "poll" && (
                  <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <PollForm
                      onSubmit={onPollSubmit}
                      loading={loading}
                      error={error}
                    />
                  </ScrollView>
                )}

                {activeForm === "event" && (
                  <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <EventForm onSubmit={onEventSubmit} />
                  </ScrollView>
                )}

                {activeForm === "service" && (
                  <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <ServiceForm onSubmit={onServiceSubmit} />
                  </ScrollView>
                )}

                {activeForm === "residentAccount" && (
                  <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <ManageProfileForm
                      onSubmit={onResidentAccountSubmit}
                      onCancel={handleClose}
                      showMobileField={true}
                      infoBanner={infoBanner}
                    />
                  </ScrollView>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const arePropsEqual = (
  prev: CreatePostModalProps,
  next: CreatePostModalProps,
) => {
  return (
    prev.visible === next.visible &&
    prev.showBack === next.showBack &&
    prev.initialForm === next.initialForm
  );
  // Removed onClose comparison - zustand functions are stable
};

export default memo(CreatePostModal, arePropsEqual);

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: "80%",
    width: "100%",
    flex: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
  },
  optionsScroll: {
    flexGrow: 1,
  },
  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: "#F3F4F6",
    elevation: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardIcon: {
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 8,
  },
});