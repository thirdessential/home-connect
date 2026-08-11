import { verificationStatus } from "@/assets/enums/common.enum";
import SelectField from "@/components/form/dropdown";
import ActionButton from "@/components/inputs/ActionButton";
import TextField from "@/components/inputs/TextField";
import InfoBanner from "@/components/UI/InfoBanner";
import { usePermissions } from "@/hooks/usePermissions";
import { ManageProfilePayload } from "@/store/auth.type";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { BusinessCategory } from "@/types/business.type";
import { InfoBannerProps } from "@/types/common.type";
import { UserRole } from "@/types/roles";
import { Tower } from "@/types/society.type";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";

export default function ManageProfileForm({
  onCancel,
  onSubmit,
  showMobileField,
  infoBanner,
  submitLabel = "Update Profile",
}: {
  onCancel: () => void;
  onSubmit: (payload: ManageProfilePayload) => void;
  showMobileField: boolean;
  infoBanner?: InfoBannerProps;
  submitLabel?: string;
}) {
  const t = useTheme();
  const { hasAnyRole } = usePermissions();
  const { societies, selectedSociety, towerList } = useSocietyStore();
  const { user } = useUserStore();

  // initial values
  const initialSocietyId = useMemo(() => {
    const sId =
      typeof user?.societyId === "string"
        ? (user?.societyId as string)
        : (user?.societyId as any)?._id;
    return sId ?? selectedSociety?._id ?? null;
  }, [user?.societyId, selectedSociety?._id]);

  const [name, setName] = useState<string>(user?.fullName ?? "");
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [societyId, setSocietyId] = useState<string | null>(initialSocietyId);
  const [towerId, setTowerId] = useState<string | null>(
    (user?.tower as string) ?? null,
  );
  const [flatNo, setFlatNo] = useState<string | null>(
    (user?.flatNo as string) ?? null,
  );
  const [mobileNumber, setMobileNumber] = useState<string | null>("");

  // Check if user is admin or super admin
  const isAdmin = useMemo(
    () => hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    [hasAnyRole],
  );

  // Handle mobile number change - only allow 10 digits
  const handleMobileChange = useCallback((text: string) => {
    const digitsOnly = text.replace(/\D/g, ""); // Strip non-digits
    const limitedDigits = digitsOnly.slice(0, 10); // Limit to 10
    setMobileNumber(limitedDigits);
  }, []);

  const selectedSoc = useMemo(() => {
    const chosen = societies.find((s) => s._id === societyId);
    if (chosen) return chosen;
    if (selectedSociety && selectedSociety._id === societyId)
      return selectedSociety;
    return null;
  }, [societies, selectedSociety, societyId]);

  const towers: Tower[] = useMemo(() => {
    if (selectedSoc) return selectedSoc.towers ?? [];
    if (societyId && selectedSociety && societyId === selectedSociety._id)
      return towerList ?? [];
    return [];
  }, [selectedSoc, societyId, selectedSociety, towerList]);

  const towerOptions: BusinessCategory[] = useMemo(
    () => towers.map((t) => ({ id: t._id, name: t.name })),
    [towers],
  );

  // simple validation
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    society?: boolean;
    tower?: boolean;
    flatNo?: string;
    mobileNumber?: string;
  }>({});

  const submit = () => {
    const nextErr: typeof errors = {};
    if (!name.trim()) nextErr.name = "Name is required";

    // Validate email if provided (optional field)
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        nextErr.email = "Please enter a valid email address";
      }
    }

    if (!societyId) nextErr.society = true;
    if (!towerId) nextErr.tower = true;
    if (!flatNo) nextErr.flatNo = "Flat No is required";
    // Validate mobile for admin users only
    if (isAdmin && !mobileNumber && showMobileField) {
      nextErr.mobileNumber = "Mobile Number is required";
    } else if (
      isAdmin &&
      mobileNumber &&
      mobileNumber.length !== 10 &&
      showMobileField
    ) {
      nextErr.mobileNumber = "Mobile Number must be 10 digits";
    }
    setErrors(nextErr);
    if (Object.keys(nextErr).length) return;

    const payload: ManageProfilePayload = {
      fullName: name.trim(),
      societyId: societyId!,
      towerId: towerId!,
      flatNo: flatNo!,
      email: email.trim(),
      completeAddress: `${flatNo!}, ${
        towers.find((t) => t._id === towerId)?.name
      }, ${selectedSociety?.completeAddress} - ${
        selectedSociety?.pincode || ""
      }`,
      isAddressVerified: { status: verificationStatus.PENDING },
    };

    // Include email if provided
    if (email.trim()) {
      payload.email = email.trim();
    }

    // Include mobile number if user is admin
    if (isAdmin && mobileNumber && showMobileField) {
      payload.mobileNumber = mobileNumber;
      payload.roles = [UserRole.RESIDENT];
      payload.isAddressVerified = { status: verificationStatus.APPROVED };
    }

    onSubmit(payload);
  };

  return (
    <View style={{ paddingVertical: 16, marginBottom: 16 }}>
      {infoBanner && <InfoBanner {...infoBanner} />}

      <TextField
        label="Name*"
        required
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        error={errors.name}
        containerStyle={{ marginBottom: 12 }}
      />

      <TextField
        label="Email"
        placeholder="Enter your email (optional)"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        containerStyle={{ marginBottom: 12 }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <TextField
        label="Society*"
        placeholder="Society"
        value={selectedSoc?.name ?? selectedSociety?.name ?? ""}
        editable={false}
        containerStyle={{ marginBottom: 12 }}
      />
      {isAdmin && showMobileField && (
        <TextField
          label="Mobile Number*"
          required
          placeholder="Enter your Mobile Number"
          value={mobileNumber ?? undefined}
          onChangeText={handleMobileChange}
          error={errors.mobileNumber}
          containerStyle={{ marginBottom: 12 }}
          keyboardType="numeric"
          maxLength={10}
        />
      )}

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <SelectField
            label="Wing*"
            options={towerOptions}
            selectedId={towerId}
            onChange={(id) => {
              setTowerId(id);
              // reset flatNo if out of bounds
              const sel = towers.find((t) => t._id === id);
              if (sel && flatNo && Number(flatNo) > (sel.floors ?? 0)) {
                setFlatNo("1");
              }
            }}
            placeholder="Select wing"
            modalTitle="Select wing"
            error={!!errors.tower}
          />
        </View>

        <View style={{ flex: 1 }}>
          <TextField
            label="Flat No*"
            required
            placeholder="Enter your Flat No"
            value={flatNo ?? undefined}
            onChangeText={setFlatNo}
            error={errors.flatNo}
            containerStyle={{ marginBottom: 12 }}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        <View style={{ flex: 1 }}>
          <ActionButton
            title="Cancel"
            variant="secondary"
            onPress={onCancel}
            fullWidth
            containerStyle={{ backgroundColor: t.colors.surfaceAlt }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ActionButton
            title={submitLabel}
            variant="primary"
            onPress={submit}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}
