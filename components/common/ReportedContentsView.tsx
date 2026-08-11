import { verificationStatus } from "@/assets/enums/common.enum";
import EmptyState from "@/components/common/EmptyState";
import CircularImage from "@/components/form/CircularImage";
import ActionButton from "@/components/inputs/ActionButton";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { Card } from "@/components/UI/Card";
import { Delete } from "@/lib/httpMethods";
import {
  ReportedBusiness,
  ReportedDailyService,
  ReportedDeal,
  ReportedFeed,
  ReportedUser,
  useAdminStore,
} from "@/store/useAdminStore";
import { useProductStore } from "@/store/useBusinessStore";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useUserStore } from "@/store/useUserStore";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportedCollection<T> {
  total: number;
  items: T[];
}

export interface ReportedContentsViewProps {
  users: ReportedCollection<ReportedUser>;
  businesses: ReportedCollection<ReportedBusiness>;
  feeds: ReportedCollection<ReportedFeed>;
  deals: ReportedCollection<ReportedDeal>;
  dailyServices: ReportedCollection<ReportedDailyService>;
}

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabKey = "users" | "businesses" | "feeds" | "deals" | "dailyServices";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "users", label: "Users", icon: "person-outline" },
  { key: "businesses", label: "Business", icon: "business-outline" },
  { key: "feeds", label: "Feeds", icon: "newspaper-outline" },
  { key: "deals", label: "Deals", icon: "pricetag-outline" },
  { key: "dailyServices", label: "Services", icon: "construct-outline" },
];

// ─── Report reason list ───────────────────────────────────────────────────────

const ReasonBadge = memo(({ reason }: { reason: string }) => {
  const theme = useTheme();
  return (
    <View
      style={[styles.reasonBadge, { backgroundColor: theme.colors.surface }]}
    >
      <Text style={[styles.reasonText, { color: theme.colors.textSecondary }]}>
        {reason}
      </Text>
    </View>
  );
});
ReasonBadge.displayName = "ReasonBadge";

// ─── Generic reported item card ───────────────────────────────────────────────

interface ReportedCardProps {
  avatar?: string;
  title: string;
  subtitle?: string;
  totalReportCount: number;
  reasons: string[];
  removeTitle?: string;
  onMarkForReview?: () => Promise<void>;
  onRemove?: () => Promise<void>;
}

const ReportedCard = memo(
  ({
    avatar,
    title,
    subtitle,
    totalReportCount,
    reasons,
    removeTitle = "Remove",
    onMarkForReview,
    onRemove,
  }: ReportedCardProps) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
      <Card style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setExpanded((p) => !p)}
        >
          <View style={styles.cardHeader}>
            <CircularImage uri={avatar} size={44} mode="view" />
            <View style={styles.cardInfo}>
              <Text
                style={[styles.cardTitle, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[
                    styles.cardSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <View style={[styles.countBadge, { backgroundColor: "#FEE2E2" }]}>
              <Text style={styles.countText}>{totalReportCount}</Text>
              <Text style={styles.countLabel}>reports</Text>
            </View>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.colors.textSecondary}
              style={{ marginLeft: 4 }}
            />
          </View>

          {expanded && reasons.length > 0 && (
            <View style={styles.reasonsContainer}>
              <Text
                style={[
                  styles.reasonsHeading,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Reported reasons:
              </Text>
              <View style={styles.reasonsRow}>
                {reasons.map((r, idx) => (
                  <ReasonBadge key={idx} reason={r} />
                ))}
              </View>
              <View style={styles.actionRow}>
                <ActionButton
                  title="Mark for Review"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  onPress={onMarkForReview}
                  leftIconName="eye-outline"
                  containerStyle={styles.actionBtn}
                />
                <ActionButton
                  title={removeTitle}
                  variant="danger"
                  size="sm"
                  fullWidth={false}
                  onPress={() => setShowDeleteConfirm(true)}
                  leftIconName="trash-outline"
                  containerStyle={styles.actionBtn}
                />
              </View>
            </View>
          )}
        </TouchableOpacity>

        <ConfirmationModal
          visible={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            await onRemove?.();
          }}
          title={removeTitle}
          message={`Are you sure you want to ${removeTitle?.toLowerCase()}? This action cannot be undone.`}
          confirmText={removeTitle}
          cancelText="Cancel"
          isDangerous={true}
          successTitle="Removed!"
          successMessage={`${removeTitle} completed successfully.`}
        />
      </Card>
    );
  },
);
ReportedCard.displayName = "ReportedCard";

// ─── Main component ───────────────────────────────────────────────────────────

const ReportedContentsView = memo(
  ({
    users,
    businesses,
    feeds,
    deals,
    dailyServices,
  }: ReportedContentsViewProps) => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState<TabKey>("users");
    const deleteUser = useUserStore.getState().deleteUser;
    const updateUser = useUserStore.getState().updateUser;
    const updateBusiness = useProductStore.getState().updateProduct;
    const removeFeed = useFeedsStore.getState().removeFeed;
    const removeDeal = useWholesaleDealStore.getState().removeDeal;
    const updateDeal = useWholesaleDealStore.getState().updateDeal;
    const updateService = useDailyHelperStore.getState().updateDailyService;
    const removeReportedUser = useAdminStore.getState().removeReportedUser;
    const removeReportedBusiness =
      useAdminStore.getState().removeReportedBusiness;
    const removeReportedFeed = useAdminStore.getState().removeReportedFeed;
    const removeReportedDeal = useAdminStore.getState().removeReportedDeal;
    const removeReportedDailyService =
      useAdminStore.getState().removeReportedDailyService;

    const countForTab = useCallback(
      (key: TabKey) => {
        switch (key) {
          case "users":
            return users.total;
          case "businesses":
            return businesses.total;
          case "feeds":
            return feeds.total;
          case "deals":
            return deals.total;
          case "dailyServices":
            return dailyServices.total;
        }
      },
      [
        users.total,
        businesses.total,
        feeds.total,
        deals.total,
        dailyServices.total,
      ],
    );

    // Build unified item list for the active tab
    const activeItems = useCallback((): ReportedCardProps[] => {
      switch (activeTab) {
        case "users":
          return users.items.map((u) => ({
            avatar: u.profilePhotoUrl,
            title: u.fullName || "Unknown User",
            subtitle: u.roles?.join(", "),
            totalReportCount: u.totalReportCount,
            reasons: (u.report || []).map((r) => r.reason),
            removeTitle: "Remove User",
            onMarkForReview: async () => {
              await updateUser(
                { isAddressVerified: { status: verificationStatus.PENDING } },
                u._id,
              );
            },
            onRemove: async () => {
              await deleteUser(u._id);
              removeReportedUser(u._id);
            },
          }));
        case "businesses":
          return businesses.items.map((b) => ({
            avatar: b.profilePhotoUrl,
            title: b.title || "Unnamed Business",
            subtitle: b.category,
            totalReportCount: b.totalReportCount,
            reasons: (b.report || []).map((r) => r.reason),
            removeTitle: "Remove Business",
            onMarkForReview: async () => {
              await updateBusiness(
                { verificationStatus: { status: verificationStatus.PENDING } },
                b._id,
              );
            },
            onRemove: async () => {
              await Delete(`/api/business/${b._id}`);
              removeReportedBusiness(b._id);
            },
          }));
        case "feeds":
          return feeds.items.map((f) => ({
            title: f.title || `${f.type || "Feed"} post`,
            subtitle: typeof f.user === "object" ? f.user?.fullName : undefined,
            totalReportCount: f.totalReportCount,
            reasons: (f.report || []).map((r) => r.reason),
            removeTitle: "Remove Feed",
            onRemove: async () => {
              await removeFeed(f._id);
              removeReportedFeed(f._id);
            },
          }));
        case "deals":
          return deals.items.map((d) => ({
            title: d.title || "Unnamed Deal",
            subtitle: d.category,
            totalReportCount: d.totalReportCount,
            reasons: (d.report || []).map((r) => r.reason),
            removeTitle: "Remove Deal",
            onMarkForReview: async () => {
              await updateDeal(
                { verificationStatus: { status: verificationStatus.PENDING } },
                d._id,
              );
            },
            onRemove: async () => {
              await removeDeal(d._id);
              removeReportedDeal(d._id);
            },
          }));
        case "dailyServices":
          return dailyServices.items.map((s) => ({
            title: s.name || "Unnamed Service",
            subtitle: s.serviceType,
            totalReportCount: s.totalReportCount,
            reasons: (s.report || []).map((r) => r.reason),
            removeTitle: "Remove Service",
            onMarkForReview: async () => {
              await updateService(
                { verificationStatus: { status: verificationStatus.PENDING } },
                s._id,
              );
            },
            onRemove: async () => {
              await Delete(`/api/daily-service/${s._id}`);
              removeReportedDailyService(s._id);
            },
          }));
        default:
          return [];
      }
    }, [activeTab, users, businesses, feeds, deals, dailyServices]);

    const renderItem = useCallback(
      ({ item }: { item: ReportedCardProps }) => <ReportedCard {...item} />,
      [],
    );

    const keyExtractor = useCallback(
      (_: ReportedCardProps, index: number) => `${activeTab}_${index}`,
      [activeTab],
    );

    const items = activeItems();

    return (
      <View style={styles.container}>
        {/* Horizontal tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = countForTab(tab.key);
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: isActive
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isActive ? "#fff" : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? "#fff" : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor: isActive ? "#fff" : "#EF4444",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        {
                          color: isActive ? theme.colors.primary : "#fff",
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Item list */}
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="shield-checkmark-outline"
              title="No Reported Content"
              subtitle="There are no reported items in this category."
            />
          }
        />
      </View>
    );
  },
);
ReportedContentsView.displayName = "ReportedContentsView";

export default ReportedContentsView;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: "row",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  tabBadge: {
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 10,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  countBadge: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },
  countLabel: {
    fontSize: 10,
    color: "#EF4444",
  },
  reasonsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  reasonsHeading: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  reasonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
  },
  reasonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reasonText: {
    fontSize: 12,
  },
});
