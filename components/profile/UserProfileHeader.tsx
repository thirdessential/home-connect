import UserAvatar from "@/components/UI/UserAvatar";
import { verificationStatus } from "@/assets/enums/common.enum";
import { User } from "@/store/auth.type";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import InfoRow from "./InfoRow";

const AVATAR_SIZE = 96;

interface UserProfileHeaderProps {
  user: User | null | undefined;
  userId?: string;
  roleDisplay: string;
  societyName: string | null;
}

/** Banner-less profile summary: avatar, name, verified badge and public info (no documents/selfies). */
const UserProfileHeader = memo(function UserProfileHeader({ user, userId, roleDisplay, societyName }: UserProfileHeaderProps) {
  const t = useTheme();
  const isVerified =
    user?.isAddressVerified?.status === verificationStatus.APPROVED ||
    user?.businessStatus?.status === verificationStatus.APPROVED;

  // `tower` may be an id; prefer a resolved name from the populated society / selected_society.
  const towerName = useMemo(() => {
    const towers = typeof user?.societyId === "object" ? user.societyId?.towers : undefined;
    const match = towers?.find((tw) => tw._id === user?.tower || tw.name === user?.tower);
    return match?.name ?? user?.selected_society?.towerName ?? (towers ? undefined : user?.tower);
  }, [user]);

  const residence = [user?.flatNo ? `Flat ${user.flatNo}` : null, towerName ? `Tower ${towerName}` : null, societyName]
    .filter(Boolean)
    .join("\n");

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <UserAvatar uri={user?.profilePhotoUrl} name={user?.fullName} userId={userId} size={AVATAR_SIZE} />
        <Text style={[styles.userName, { color: t.colors.textPrimary }]}>{user?.fullName || "User"}</Text>
        {isVerified ? (
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={16} color={t.colors.brand} />
            <Text style={[styles.verifiedText, { color: t.colors.brand }]}>Verified Resident</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.sectionTitle, { color: t.colors.textPrimary, borderTopColor: t.colors.border }]}>Profile Information</Text>
      <View style={styles.infoSection}>
        {user?.phone ? <InfoRow icon="call-outline" label="Phone" value={user.phone} iconColor="#05275e" backgroundColor="#5c94ee1b" /> : null}
        {residence ? <InfoRow icon="business-outline" label="Residence" value={residence} iconColor="#680528" backgroundColor="#ed8eaf22" /> : null}
        <InfoRow icon="home-outline" label="Role" value={roleDisplay} iconColor="#056829" backgroundColor="#a3fac32b" />
      </View>

      <Text style={[styles.sectionTitle, { color: t.colors.textPrimary, borderTopColor: t.colors.border }]}>User Content</Text>
    </View>
  );
});

export default UserProfileHeader;

const styles = StyleSheet.create({
  wrap: { paddingTop: 8 },
  top: { alignItems: "center", gap: 8, paddingBottom: 20 },
  userName: { fontSize: 22, fontFamily: "Manrope_700Bold", marginTop: 4 },
  verified: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
  sectionTitle: { fontSize: 16, fontFamily: "Manrope_700Bold", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, marginBottom: 12 },
  infoSection: { gap: 16, paddingBottom: 20 },
});
