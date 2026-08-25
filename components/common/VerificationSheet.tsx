import { verificationStatus } from "@/assets/enums/common.enum";
import { BUSINESS_CAT_MOCK } from "@/assets/mocks/category";
import BusinessForm from "@/components/form/BusinessForm";
import ManageProfileForm from "@/components/form/ManageProfileForm";
import FormSheetModal from "@/components/modals/FormSheetModal";
import ResidentProofStep, { ResidentProofResult } from "@/components/onboarding/ResidentProofStep";
import RoleUsageStep, { UsageRole } from "@/components/onboarding/RoleUsageStep";
import { useAuthStore } from "@/store/useAuthStore";
import { useProductStore } from "@/store/useBusinessStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { BusinessCategory, Product } from "@/types/business.type";
import { InfoBannerProps } from "@/types/common.type";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";

const CONTENT_CONTAINER_STYLE = { paddingVertical: 20 };

type Stage = "role" | "step1" | "step2" | "business";

export type VerificationSheetProps = {
  visible: boolean;
  onClose: () => void;
  /**
   * Called when a form completes successfully.
   * role will be 'resident' or 'business', payload is the form data.
   */
  onCompleted?: (role: "resident" | "business", payload?: any) => void;
  categories?: BusinessCategory[];
};

function VerificationSheetInner({
  visible,
  onClose,
  onCompleted,
  categories = BUSINESS_CAT_MOCK,
}: VerificationSheetProps) {
  const [stage, setStage] = useState<Stage>("role");
  const [usageRole, setUsageRole] = useState<UsageRole | null>(null);
  // Step 1's fields, held until step 2 (proof) completes so both submit together.
  const [residentDraft, setResidentDraft] = useState<any>(null);
  const [submissionState, setSubmissionState] = useState<
    | { type: "idle" }
    | { type: "submitting" }
    | { type: "success"; message: string }
    | { type: "error"; message: string }
  >({ type: "idle" });
  const updateUser = useUserStore((s) => s.updateUser);
  const setUser = useUserStore((s) => s.setUser);
  const userId = useUserStore((s) => s.user?._id);
  const userPhone = useUserStore((s) => s.user?.phone);
  const userRoles = useUserStore((s) => s.user?.roles);
  const societyId = useSocietyStore((s) => s.selectedSociety?._id);
  const societyName = useSocietyStore((s) => s.selectedSociety?.name);
  const towerList = useSocietyStore((s) => s.towerList);
  const getTowerById = useSocietyStore((s) => s.getTowerById);
  const submitVerification = useSocietyStore((s) => s.submitVerification);
  const setRoles = useAuthStore((s) => s.setRoles);
  const createProduct = useProductStore((s) => s.createProduct);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardOpen(true);
    });

    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardOpen(false);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // dev logs removed

  // Reset selection whenever modal is closed from outside or visibility changes
  useEffect(() => {
    if (!visible) {
      setStage("role");
      setUsageRole(null);
      setResidentDraft(null);
      setSubmissionState({ type: "idle" });
    }
  }, [visible]);

  const handleFormCancel = useCallback(() => {
    setStage("role");
    setUsageRole(null);
    setResidentDraft(null);
    setSubmissionState({ type: "idle" });
    onClose();
  }, [onClose]);

  const handleFormSubmit = useCallback(
    (role: "resident" | "business", payload?: any) => {
      onCompleted?.(role, payload);
      onClose();
    },
    [onCompleted, onClose],
  );
  const handleFormSubmitRef = useRef(handleFormSubmit);
  handleFormSubmitRef.current = handleFormSubmit;

  const handleRoleContinue = useCallback(() => {
    if (!usageRole) return;
    setStage(usageRole === "business" ? "business" : "step1");
  }, [usageRole]);

  const title = useMemo(() => {
    switch (stage) {
      case "role":
        return "How will you use Terrace?";
      case "step1":
        return "Let's start with some basics";
      case "step2":
        return "Verify your identity";
      case "business":
        return "Create your business";
      default:
        return "";
    }
  }, [stage]);

  const subtitle = useMemo(() => {
    switch (stage) {
      case "role":
        return "We verify every resident and business to keep your community safe and trusted.";
      case "step1":
        return "Add a few details about yourself.";
      case "step2":
        return "A few quick steps to help us verify you as a resident.";
      default:
        return undefined;
    }
  }, [stage]);

  const infoBanner = useMemo<InfoBannerProps | undefined>(() => {
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
  }, []);

  const contentContainerStyle = CONTENT_CONTAINER_STYLE;

  const handleClose = useCallback(() => {
    setStage("role");
    setUsageRole(null);
    setResidentDraft(null);
    setSubmissionState({ type: "idle" });
    onClose();
  }, [onClose]);

  // Step 1 ("Basic Details") just captures the draft and advances — the
  // actual submit happens after step 2 (proof) so both go to the server together.
  const handleStep1Continue = useCallback((payload: any) => {
    setResidentDraft(payload);
    setStage("step2");
  }, []);

  const handleProofContinue = useCallback(
    async (proof: ResidentProofResult) => {
      if (!userId || !residentDraft) {
        handleFormSubmitRef.current("resident", residentDraft);
        return;
      }
      setSubmissionState({ type: "submitting" });
      try {
        const towerName = residentDraft.towerId
          ? getTowerById(residentDraft.towerId, towerList)?.name
          : undefined;

        // Submits to the server as `pending` — the resident role is only
        // granted once the society admin approves the request, not here.
        const updatedUser = await submitVerification({
          society_id: residentDraft.societyId,
          full_name: residentDraft.fullName,
          email: residentDraft.email,
          tower: towerName,
          flat_no: residentDraft.flatNo,
          ...proof,
        });

        if (updatedUser) setUser(updatedUser);

        if (usageRole === "both") {
          // Continue into the business form before showing the confirmation.
          setStage("business");
          setSubmissionState({ type: "idle" });
          return;
        }

        setSubmissionState({
          type: "success",
          message: `Your request to join ${societyName ?? "the society"} has been submitted.`,
        });
        setTimeout(() => {
          handleFormSubmitRef.current("resident", residentDraft);
          setSubmissionState({ type: "idle" });
        }, 1800);
      } catch (err: any) {
        console.error("[VerificationSheet] handleProofContinue — error:", err);
        setSubmissionState({
          type: "error",
          message: err?.message || "Failed to submit verification. Please try again.",
        });
      }
    },
    [userId, residentDraft, usageRole, societyName, towerList, getTowerById, submitVerification, setUser],
  );

  const handleBusinessSubmit = useCallback(
    async (businessFormData: any) => {
      console.log(
        "[VerificationSheet] handleBusinessSubmit — businessFormData:",
        businessFormData,
        "userId:",
        userId,
      );
      const normalizedPhone = businessFormData.businessPhone
        ? businessFormData.businessPhone.startsWith("+")
          ? businessFormData.businessPhone
          : `+91${businessFormData.businessPhone}`
        : undefined;

      const newBusiness: Product = {
        title: businessFormData.title,
        description: businessFormData.description,
        businessPhone: normalizedPhone,
        completeAddress: businessFormData.address,
        images: businessFormData.images,
        category: businessFormData.category,
        shopTimings: businessFormData.shopTimings,
        city: businessFormData.city || "Pune",
        email: businessFormData.email || "",
        gstNumber: businessFormData.gstNumber || "",
        price: {
          mrp: "0",
          discountPrcnt: "0",
          saveAmount: "0",
          sellingPrice: String(businessFormData.price) || "0",
        },
        phone: userPhone,
        userId: userId,
        societyId: societyId,
        verificationStatus: {
          status: verificationStatus.PENDING,
          rejectionReason: null,
        },
      };
      let updatedRoles: string[] | typeof userRoles = userRoles;
      try {
        if (userId) {
          updatedRoles = Array.isArray(userRoles)
            ? (userRoles as string[]).filter((r: string) => r !== "guest")
            : userRoles;
          if (
            Array.isArray(updatedRoles) &&
            !updatedRoles.includes(UserRole.BUSINESS)
          ) {
            updatedRoles.push(UserRole.BUSINESS);
          }
          console.log(
            "[VerificationSheet] handleBusinessSubmit — updatedRoles:",
            updatedRoles,
          );
          setSubmissionState({ type: "submitting" });
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
            userId,
          );
        }
        await createProduct(newBusiness);
        console.log(
          "[VerificationSheet] handleBusinessSubmit — createProduct success",
        );
        setSubmissionState({
          type: "success",
          message: "Business created successfully!",
        });
        setTimeout(() => {
          setRoles(updatedRoles as string[]);
          handleFormSubmitRef.current("business", businessFormData);
          setSubmissionState({ type: "idle" });
        }, 1800);
      } catch (err: any) {
        console.error("[VerificationSheet] handleBusinessSubmit — error:", err);
        setSubmissionState({
          type: "error",
          message:
            err?.message || "Failed to create business. Please try again.",
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- createProduct/updateUser/setRoles are stable Zustand actions
    [userPhone, userId, societyId, userRoles],
  );

  return (
    <KeyboardAvoidingView
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : keyboardOpen
            ? "height"
            : undefined
      }
      style={{ flex: 1 }}
      keyboardVerticalOffset={100}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <FormSheetModal
            visible={visible}
            onClose={handleClose}
            title={title}
            subtitle={subtitle}
            scroll={true}
            contentContainerStyle={contentContainerStyle}
          >
            <ScrollView
              // showsVerticalScrollIndicator={false}
              // keyboardShouldPersistTaps="handled"
              // contentContainerStyle={{
              //   paddingBottom: keyboardOpen ? 80 : 0,
              //   flexGrow: 1,
              // }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: keyboardOpen ? Platform.OS === "ios" ? 150 : 80 : 0,
              }}
            >

              {/* Success / Error feedback overlay */}
              {(submissionState.type === "success" ||
                submissionState.type === "error") && (
                  <View style={styles.feedbackContainer}>
                    <View
                      style={[
                        styles.feedbackIconCircle,
                        {
                          backgroundColor:
                            submissionState.type === "success" ? "#DCFCE7" : "#FEE2E2",
                        },
                      ]}
                    >
                      <Ionicons
                        name={submissionState.type === "success" ? "checkmark" : "close"}
                        size={36}
                        color={submissionState.type === "success" ? "#16A34A" : "#EF4444"}
                      />
                    </View>
                    <Text style={styles.feedbackMessage}>{submissionState.message}</Text>
                  </View>
                )}

              {submissionState.type !== "success" &&
                submissionState.type !== "error" && (
                  <>
                    {stage === "role" && (
                      <RoleUsageStep
                        selected={usageRole}
                        onSelect={setUsageRole}
                        onContinue={handleRoleContinue}
                      />
                    )}

                    {(stage === "step1" || stage === "step2") && (
                      <View style={styles.stepperRow}>
                        {["Basic Details", "Verification", "Review"].map((label, i) => {
                          const stepNum = i + 1;
                          const active = stage === "step1" ? stepNum === 1 : stepNum <= 2;
                          return (
                            <View key={label} style={styles.stepperItem}>
                              <View
                                style={[
                                  styles.stepperCircle,
                                  { backgroundColor: active ? "#15803D" : "#E5E7EB" },
                                ]}
                              >
                                <Text
                                  style={{
                                    color: active ? "#fff" : "#6B7280",
                                    fontWeight: "700",
                                    fontSize: 12,
                                  }}
                                >
                                  {stepNum}
                                </Text>
                              </View>
                              <Text style={styles.stepperLabel}>{label}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {stage === "step1" && (
                      <ManageProfileForm
                        onCancel={handleFormCancel}
                        onSubmit={handleStep1Continue}
                        showMobileField={false}
                        infoBanner={infoBanner}
                        submitLabel="Continue"
                      />
                    )}

                    {stage === "step2" && (
                      <ResidentProofStep
                        onContinue={handleProofContinue}
                        submitting={submissionState.type === "submitting"}
                      />
                    )}

                    {stage === "business" && (
                      <BusinessForm
                        categories={categories}
                        onBack={handleFormCancel}
                        onSubmit={handleBusinessSubmit}
                      />
                    )}
                  </>
                )}
            </ScrollView>
          </FormSheetModal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const VerificationSheet = memo(VerificationSheetInner);
export default VerificationSheet;

const styles = StyleSheet.create({
  feedbackContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 16,
  },
  feedbackIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackMessage: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#1F2937",
    lineHeight: 22,
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  stepperItem: {
    alignItems: "center",
    gap: 4,
  },
  stepperCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
});
