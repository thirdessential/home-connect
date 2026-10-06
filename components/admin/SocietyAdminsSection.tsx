import { useToast } from "@/components/common/Toast";
import CircularImage from "@/components/form/CircularImage";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import FormSheetModal from "@/components/modals/FormSheetModal";
import {
  EligibleResident,
  SocietyAdmin,
  useAdminStore,
} from "@/store/useAdminStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = { societyId: string; societyName: string };

const sinceLabel = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const flatLabel = (r: { tower?: string | null; flat_no?: string | null }) =>
  [r.tower, r.flat_no].filter(Boolean).join(" · ");

/**
 * Super Admin only: manage who administers a society. All authorization is
 * enforced by the backend; this component is only rendered for super admins.
 */
function SocietyAdminsSection({ societyId, societyName }: Props) {
  const t = useTheme();
  const { showStatusToast } = useToast();
  const getSocietyAdmins = useAdminStore((s) => s.getSocietyAdmins);
  const getEligibleResidents = useAdminStore((s) => s.getEligibleResidents);
  const makeSocietyAdmin = useAdminStore((s) => s.makeSocietyAdmin);
  const removeSocietyAdmin = useAdminStore((s) => s.removeSocietyAdmin);

  const [admins, setAdmins] = useState<SocietyAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [residents, setResidents] = useState<EligibleResident[]>([]);
  const [residentsLoading, setResidentsLoading] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<EligibleResident | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SocietyAdmin | null>(null);
  const busyRef = useRef(false); // blocks duplicate submissions
  const reqSeq = useRef(0);

  const errorMessage = (e: any) =>
    e?.status === 403
      ? "You do not have permission to perform this action."
      : e?.message && !/sql|ER_/i.test(e.message)
        ? e.message
        : "Something went wrong. Please try again.";

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      setAdmins(await getSocietyAdmins(societyId));
    } catch (e: any) {
      showStatusToast({ title: "Couldn't load admins", message: errorMessage(e), tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [societyId, getSocietyAdmins, showStatusToast]);

  useEffect(() => {
    setAdmins([]);
    loadAdmins();
  }, [loadAdmins]);

  // Eligible residents — debounced server-side search; stale responses ignored.
  useEffect(() => {
    if (!pickerVisible) return;
    const seq = ++reqSeq.current;
    setResidentsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const list = await getEligibleResidents(societyId, search);
        if (seq === reqSeq.current) setResidents(list);
      } catch (e: any) {
        if (seq === reqSeq.current) {
          setResidents([]);
          showStatusToast({ title: "Couldn't load residents", message: errorMessage(e), tone: "error" });
        }
      } finally {
        if (seq === reqSeq.current) setResidentsLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [pickerVisible, search, societyId, getEligibleResidents, showStatusToast]);

  const closePicker = useCallback(() => {
    setPickerVisible(false);
    setSearch("");
  }, []);

  const handlePick = useCallback((r: EligibleResident) => {
    setPickerVisible(false);
    setSearch("");
    setPromoteTarget(r);
  }, []);

  const confirmPromote = useCallback(async () => {
    if (!promoteTarget || busyRef.current) return;
    busyRef.current = true;
    try {
      await makeSocietyAdmin(societyId, promoteTarget.user_id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showStatusToast({ title: "Done", message: "Resident is now a Society Admin", tone: "success" });
      await loadAdmins();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      showStatusToast({ title: "Couldn't make admin", message: errorMessage(e), tone: "error" });
      throw e; // keeps the confirmation open instead of showing success
    } finally {
      busyRef.current = false;
    }
  }, [promoteTarget, makeSocietyAdmin, societyId, loadAdmins, showStatusToast]);

  const confirmRemove = useCallback(async () => {
    if (!removeTarget || busyRef.current) return;
    busyRef.current = true;
    try {
      await removeSocietyAdmin(societyId, removeTarget.user_id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showStatusToast({ title: "Done", message: "Admin access removed", tone: "success" });
      await loadAdmins();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      showStatusToast({ title: "Couldn't remove admin", message: errorMessage(e), tone: "error" });
      throw e;
    } finally {
      busyRef.current = false;
    }
  }, [removeTarget, removeSocietyAdmin, societyId, loadAdmins, showStatusToast]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: t.colors.textPrimary }]}>Society Admins</Text>
      <Text style={[styles.sub, { color: t.colors.textSecondary }]}>{societyName}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginVertical: 16 }} color={t.colors.primary} />
      ) : admins.length === 0 ? (
        <Text style={[styles.empty, { color: t.colors.textSecondary }]}>
          No Society Admins yet.
        </Text>
      ) : (
        admins.map((a) => (
          <View
            key={a.user_id}
            style={[styles.card, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}
          >
            <CircularImage uri={a.profile_image ?? undefined} size={44} name={a.name} avatarUserId={a.user_id} />
            <View style={styles.cardBody}>
              <Text style={[styles.name, { color: t.colors.textPrimary }]} numberOfLines={1}>
                {a.name}
              </Text>
              <Text style={[styles.meta, { color: t.colors.textSecondary }]}>
                Resident{sinceLabel(a.admin_since) ? ` · Admin since ${sinceLabel(a.admin_since)}` : ""}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setRemoveTarget(a)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${a.name} as admin`}
              style={styles.removeBtn}
            >
              <Text style={styles.removeText}>Remove as Admin</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: t.colors.primary }]}
        onPress={() => setPickerVisible(true)}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.addText}>Make Resident Admin</Text>
      </TouchableOpacity>

      <FormSheetModal visible={pickerVisible} onClose={closePicker} title="Select Resident" scroll={false}>
        <View style={styles.searchWrap}>
          <View style={[styles.searchBox, { backgroundColor: t.colors.surface }]}>
            <Ionicons name="search" size={18} color={t.colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search by name, phone or flat"
              placeholderTextColor={t.colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: t.colors.textPrimary }]}
            />
          </View>
        </View>
        {residentsLoading && residents.length === 0 ? (
          <ActivityIndicator style={{ margin: 24 }} color={t.colors.primary} />
        ) : (
          <FlatList
            data={residents}
            keyExtractor={(r) => r.user_id}
            style={{ maxHeight: 420 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={[styles.empty, { color: t.colors.textSecondary, padding: 24 }]}>
                No eligible residents found.
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handlePick(item)}
                style={[styles.row, { borderBottomColor: t.colors.border }]}
              >
                <CircularImage uri={item.profile_image ?? undefined} size={40} name={item.name} avatarUserId={item.user_id} />
                <View style={styles.cardBody}>
                  <Text style={[styles.name, { color: t.colors.textPrimary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.meta, { color: t.colors.textSecondary }]} numberOfLines={1}>
                    {flatLabel(item) || item.phone || "Resident"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </FormSheetModal>

      <ConfirmationModal
        visible={!!promoteTarget}
        onClose={() => setPromoteTarget(null)}
        onConfirm={confirmPromote}
        title="Make this resident a Society Admin?"
        message={`${promoteTarget?.name ?? "This user"} will get admin access to ${societyName}, including resident requests, business requests, and reports.`}
        confirmText="Confirm"
        successTitle="Society Admin added"
        successMessage="Resident is now a Society Admin"
      />

      <ConfirmationModal
        visible={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        title="Remove Admin Access?"
        message={`Are you sure you want to remove admin access from ${removeTarget?.name ?? "this user"}? They will remain a resident of this society, but will no longer be able to manage resident requests, business requests, or reports.`}
        confirmText="Remove Admin"
        isDangerous
        successTitle="Admin access removed"
        successMessage="They remain a resident of this society"
      />
    </View>
  );
}

export default memo(SocietyAdminsSection);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 12 },
  heading: { fontSize: 18, fontFamily: "Manrope_700Bold" },
  sub: { fontSize: 13, marginBottom: 12 },
  empty: { fontSize: 14, marginVertical: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  cardBody: { flex: 1 },
  name: { fontSize: 15, fontFamily: "Manrope_600SemiBold" },
  meta: { fontSize: 12, marginTop: 2 },
  removeBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  removeText: { color: "#DC2626", fontSize: 12, fontFamily: "Manrope_600SemiBold" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  addText: { color: "#fff", fontSize: 15, fontFamily: "Manrope_600SemiBold" },
  searchWrap: { paddingHorizontal: 16, paddingTop: 8 },
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
