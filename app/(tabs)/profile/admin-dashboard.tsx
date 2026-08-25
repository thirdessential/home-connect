import { verificationStatus } from "@/assets/enums/common.enum";
import BulkActionBar from "@/components/admin/BulkActionBar";
import DashboardHeader from "@/components/admin/DashboardHeader";
import DashboardSkeleton from "@/components/admin/DashboardSkeleton";
import FetchingOverlay from "@/components/admin/FetchingOverlay";
import PendingRequestsSection from "@/components/admin/PendingRequestsSection";
import SocietySelectorModal from "@/components/admin/SocietySelectorModal";
import StatsSection, {
  SelectedStatsCard,
  VerificationStats,
} from "@/components/admin/StatsSection";
import ApprovedBusinessView from "@/components/common/ApprovedBusinessView";
import ApprovedDailyServicesView from "@/components/common/ApprovedDailyServicesView";
import ApprovedResidentsView from "@/components/common/ApprovedResidentsView";
import EmptyState from "@/components/common/EmptyState";
import ReportedContentsView from "@/components/common/ReportedContentsView";
import OrderSuccessModal from "@/components/modals/OrderSuccessModal";
import RejectModal from "@/components/modals/RejectModal";
import { usePermissions } from "@/hooks/usePermissions";
import { transformDataForDisplay } from "@/lib/adminHelper";
import { useAdminStore } from "@/store/useAdminStore";
import { useProductStore } from "@/store/useBusinessStore";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { UserRole, UserType } from "@/types/roles";
import { Society } from "@/types/society.type";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type DashboardView =
  | "main"
  | "pending"
  | "approved"
  | "business"
  | "services"
  | "reported-contents";

export default function AdminDashboard() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { hasRole } = usePermissions();
  const isSuperAdmin = hasRole(UserRole.SUPER_ADMIN);
  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 40 : 40);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(
    new Set(),
  );
  const [selectedEntityType, setSelectedEntityType] = useState("all");
  const [currentView, setCurrentView] = useState<DashboardView>("main");
  const [selectedStatsCard, setSelectedStatsCard] =
    useState<SelectedStatsCard>("pending");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectingType, setRejectingType] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  // When true the reject modal's reason applies to every selected request.
  const [isBulkReject, setIsBulkReject] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [societySelectorVisible, setSocietySelectorVisible] = useState(false);
  const [societySearch, setSocietySearch] = useState("");
  const [isFetchingSocietyData, setIsFetchingSocietyData] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adminSociety, setAdminSociety] = useState<Society | null>(null);

  // ── Store selectors ───────────────────────────────────────────────────────────
  const syncUserBusinessIdsWithStatus = useUserStore(
    (state) => state.syncUserBusinessIdsWithStatus,
  );
  const updateBusinessVerificationStatus = useProductStore(
    (state) => state.updateBusinessVerificationStatus,
  );
  const updateDailyService = useDailyHelperStore(
    (state) => state.updateDailyService,
  );
  const adminSocietyId = adminSociety?._id as string | undefined;
  const societies = useSocietyStore((state) => state.societies);
  const getAllSociety = useSocietyStore((state) => state.getAllSociety);
  const ownSociety = useSocietyStore((state) => state.selectedSociety);
  const towerList = adminSociety?.towers ?? [];
  const pendingContent = useAdminStore((state) => state.pendingContent);
  const getAllPendingContent = useAdminStore(
    (state) => state.getAllPendingContent,
  );
  const approveMysqlBusiness = useAdminStore(
    (state) => state.approveMysqlBusiness,
  );
  const rejectMysqlBusiness = useAdminStore(
    (state) => state.rejectMysqlBusiness,
  );
  const approveResident = useAdminStore((state) => state.approveResident);
  const rejectResident = useAdminStore((state) => state.rejectResident);
  const approvedContent = useAdminStore((state) => state.approvedContent);
  const getAllApprovedContent = useAdminStore(
    (state) => state.getAllApprovedContent,
  );
  const reportedContent = useAdminStore((state) => state.reportedContent);
  const getAllReportedContent = useAdminStore(
    (state) => state.getAllReportedContent,
  );

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    // For regular admins, auto-load their own society's data on mount
    if (!isSuperAdmin && ownSociety) {
      setAdminSociety(ownSociety);
      setIsInitialLoading(true);
      Promise.allSettled([
        getAllPendingContent(ownSociety._id),
        getAllApprovedContent(ownSociety._id),
        getAllReportedContent(ownSociety._id),
      ]).finally(() => setIsInitialLoading(false));
      return;
    }
    if (!adminSocietyId) return;
    if (pendingContent.totalCount > 0) return;
    setIsInitialLoading(true);
    Promise.allSettled([
      getAllPendingContent(adminSocietyId),
      getAllApprovedContent(adminSocietyId),
      getAllReportedContent(adminSocietyId),
    ]).finally(() => setIsInitialLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // ── Stats card handlers ───────────────────────────────────────────────────────
  const handlePendingRequestsClick = useCallback(() => {
    setCurrentView("main");
    setSelectedEntityType("all");
    setSelectedStatsCard("pending");
  }, []);

  const handleApprovedResidentsClick = useCallback(() => {
    setCurrentView("approved");
    setSelectedStatsCard("approved-residents");
  }, []);

  const handleApprovedBusinessClick = useCallback(() => {
    setCurrentView("business");
    setSelectedStatsCard("approved-business");
  }, []);

  const handleApprovedServicesClick = useCallback(() => {
    setCurrentView("services");
    setSelectedStatsCard("approved-services");
  }, []);

  const handleReportedContentsClick = useCallback(() => {
    setCurrentView("reported-contents");
    setSelectedStatsCard("reported-contents");
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const pendingUsers = pendingContent.residents.items;
    const pendingBusinesses = pendingContent.businesses.items;
    const pendingServices = pendingContent.dailyServices.items;
    return {
      users:
        selectedEntityType === "all" || selectedEntityType === "user"
          ? pendingUsers
          : [],
      businesses:
        selectedEntityType === "all" || selectedEntityType === "business"
          ? pendingBusinesses
          : [],
      services:
        selectedEntityType === "all" || selectedEntityType === "service"
          ? pendingServices
          : [],
    };
  }, [selectedEntityType, pendingContent]);

  const verificationStats = useMemo((): VerificationStats => {
    return {
      pendingRequests: pendingContent.totalCount,
      approvedResidents: approvedContent.residents?.total ?? 0,
      approvedBusinesses: approvedContent.businesses?.total ?? 0,
      approvedServices: approvedContent.dailyServices?.total ?? 0,
      reportedContents: reportedContent.totalCount || 0,
    };
  }, [pendingContent, approvedContent, reportedContent]);

  const displayData = useMemo(() => {
    const requests = [
      ...filteredData.users.map((u) =>
        transformDataForDisplay(u, "user", adminSociety),
      ),
      ...filteredData.businesses.map((b) =>
        transformDataForDisplay(b, "business", adminSociety),
      ),
      ...filteredData.services.map((s) =>
        transformDataForDisplay(s, "service", adminSociety),
      ),
    ];
    return { requests };
  }, [filteredData, adminSociety]);

  const allRequestsSelected = useMemo(() => {
    const ids = displayData.requests.map((r) => r.id);
    return ids.length > 0 && ids.every((id) => selectedRequests.has(id));
  }, [displayData.requests, selectedRequests]);

  // ── Selection ─────────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback((filterId: string) => {
    setSelectedEntityType(filterId);
    setSelectedRequests(new Set());
  }, []);

  const handleRequestSelect = useCallback(
    (requestId: string, isSelected: boolean) => {
      setSelectedRequests((prev) => {
        const next = new Set(prev);
        isSelected ? next.add(requestId) : next.delete(requestId);
        return next;
      });
    },
    [],
  );

  const isRequestSelected = useCallback(
    (id: string) => selectedRequests.has(id),
    [selectedRequests],
  );

  const handleSelectAll = useCallback(() => {
    const ids = displayData.requests.map((r) => r.id);
    const allSelected =
      ids.length > 0 && ids.every((id) => selectedRequests.has(id));
    setSelectedRequests(allSelected ? new Set() : new Set(ids));
  }, [displayData.requests, selectedRequests]);

  // ── Approve / Reject ──────────────────────────────────────────────────────────
  const approvalHandlers = useMemo(
    () => ({
      // MySQL-backed contract (source of truth) — grants the `resident` role
      // and refreshes the society's resident count server-side. The old
      // `updateUser` PATCH only touched the legacy Mongo mirror, so approving
      // never actually changed status and the request stayed "pending".
      [UserType.RESIDENT]: (id: string) => approveResident(id),
      [UserType.SERVICE]: (id: string) =>
        updateDailyService(
          {
            verificationStatus: {
              status: verificationStatus.APPROVED,
              rejectionReason: null,
            },
          },
          id,
        ),
    }),
    [],
  );

  const rejectionHandlers = useMemo(
    () => ({
      [UserType.RESIDENT]: (id: string, reason: string) =>
        rejectResident(id, reason),
      [UserType.SERVICE]: (id: string, reason: string) =>
        updateDailyService(
          {
            verificationStatus: {
              status: verificationStatus.REJECTED,
              rejectionReason: reason,
            },
          },
          id,
        ),
    }),
    [],
  );

  const resolveSid = useCallback(() => adminSocietyId, [adminSocietyId]);

  const refetchBySid = useCallback(async (_type: string, sid: string) => {
    await getAllPendingContent(sid);
  }, []);

  // Prevent duplicate approve/reject taps while one is in flight.
  const processingRef = useRef<Set<string>>(new Set());

  // Approves a single request. Extracted so bulk approve reuses the exact same
  // per-type branching (mirrors rejectOne) instead of re-running the whole
  // refetch + success-modal cycle once per selected item. Throws on failure so
  // the caller decides how to surface it.
  const approveOne = useCallback(
    async (targetId: string, targetType: string) => {
      if (targetType === UserType.BUSINESS) {
        const req = displayData.requests.find((r) => r.id === targetId);
        if (req?.source === "mysql") {
          // New MySQL business contract — do NOT use the Mongo status endpoint.
          await approveMysqlBusiness(req.businessId);
          return;
        }
        if (!req?.ownerId) {
          throw new Error("Missing business owner reference");
        }
        await updateBusinessVerificationStatus(
          targetId,
          req.ownerId,
          verificationStatus.APPROVED,
        );
        return;
      }

      const handler =
        approvalHandlers[targetType as keyof typeof approvalHandlers];
      if (!handler) {
        throw new Error(`Unknown request type: ${targetType}`);
      }
      await handler(targetId);
      if (targetType === "deal" || targetType === "service") {
        const req = displayData.requests.find((r) => r.id === targetId);
        if (req?.ownerId) await syncUserBusinessIdsWithStatus(req.ownerId);
      }
    },
    [
      displayData.requests,
      approveMysqlBusiness,
      approvalHandlers,
      updateBusinessVerificationStatus,
      syncUserBusinessIdsWithStatus,
    ],
  );

  const handleApprove = useCallback(
    async (id: string, type: string) => {
      if (processingRef.current.has(id)) return;
      processingRef.current.add(id);
      try {
        await approveOne(id, type);
        const sid = resolveSid();
        if (sid) await refetchBySid(type, sid);
        await new Promise((res) => setTimeout(res, 100));
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);
      } catch (error) {
        console.error("Failed to approve:", error);
        Alert.alert("Approval Failed", "Could not approve this request. Please try again.");
      } finally {
        processingRef.current.delete(id);
      }
    },
    [approveOne, resolveSid, refetchBySid],
  );

  const handleReject = useCallback((id: string, type: string) => {
    setRejectingId(id);
    setRejectingType(type);
    setShowRejectModal(true);
  }, []);

  // Rejects a single request. Extracted so bulk reject reuses the exact same
  // per-type branching instead of duplicating it.
  const rejectOne = useCallback(
    async (targetId: string, targetType: string, reason: string) => {
      if (targetType === UserType.BUSINESS) {
        const req = displayData.requests.find((r) => r.id === targetId);
        if (req?.source === "mysql") {
          await rejectMysqlBusiness(req.businessId, reason);
        } else {
          if (!req?.ownerId) {
            throw new Error("Missing business owner reference");
          }
          await updateBusinessVerificationStatus(
            targetId,
            req.ownerId,
            verificationStatus.REJECTED,
            reason,
          );
        }
      } else {
        const handler =
          rejectionHandlers[targetType as keyof typeof rejectionHandlers];
        if (!handler) {
          throw new Error(`Unknown request type: ${targetType}`);
        }
        await handler(targetId, reason);
        if (targetType === "deal" || targetType === "service") {
          const req = displayData.requests.find((r) => r.id === targetId);
          if (req?.ownerId) await syncUserBusinessIdsWithStatus(req.ownerId);
        }
      }
    },
    [
      displayData.requests,
      rejectMysqlBusiness,
      rejectionHandlers,
      updateBusinessVerificationStatus,
      syncUserBusinessIdsWithStatus,
    ],
  );

  const handleRejectSubmit = useCallback(
    async (reason: string) => {
      // Bulk mode: one shared reason applied to every selected request.
      if (isBulkReject) {
        const ids = Array.from(selectedRequests);
        setIsRejecting(true);
        let failed = 0;
        try {
          for (const id of ids) {
            const req = displayData.requests.find((r) => r.id === id);
            if (!req?.type) continue;
            try {
              await rejectOne(id, req.type, reason);
            } catch (error) {
              failed += 1;
              console.error("Failed to reject:", id, error);
            }
          }
          const sid = resolveSid();
          if (sid) await getAllPendingContent(sid);

          setShowRejectModal(false);
          setIsBulkReject(false);
          setSelectedRequests(new Set());
          if (failed > 0) {
            Alert.alert(
              "Some Rejections Failed",
              `${ids.length - failed} of ${ids.length} were rejected. Please retry the rest.`,
            );
          } else {
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 1500);
          }
        } finally {
          setIsRejecting(false);
        }
        return;
      }

      if (!rejectingId || !rejectingType) return;
      if (processingRef.current.has(rejectingId)) return;
      processingRef.current.add(rejectingId);
      setIsRejecting(true);
      try {
        await rejectOne(rejectingId, rejectingType, reason);

        // Close the popup and refresh the list unconditionally on success —
        // this must never depend on resolveSid() being truthy, otherwise the
        // modal stays stuck open even though the rejection already went through.
        const sid = resolveSid();
        if (sid) await refetchBySid(rejectingType, sid);

        setShowRejectModal(false);
        setRejectingId(null);
        setRejectingType(null);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);
      } catch (error) {
        console.error("Failed to reject:", error);
        Alert.alert("Rejection Failed", "Could not reject this request. Please try again.");
      } finally {
        processingRef.current.delete(rejectingId);
        setIsRejecting(false);
      }
    },
    [
      isBulkReject,
      selectedRequests,
      rejectingId,
      rejectingType,
      displayData.requests,
      rejectOne,
      resolveSid,
      refetchBySid,
      getAllPendingContent,
    ],
  );

  const handleRejectModalClose = useCallback(() => {
    setShowRejectModal(false);
    setRejectingId(null);
    setRejectingType(null);
    setIsBulkReject(false);
  }, []);

  const handleSuccessDismiss = useCallback(
    () => setShowSuccessModal(false),
    [],
  );

  const handleRefresh = useCallback(async () => {
    if (!adminSocietyId) return;
    setIsRefreshing(true);
    await Promise.allSettled([
      getAllPendingContent(adminSocietyId),
      getAllApprovedContent(adminSocietyId),
      getAllReportedContent(adminSocietyId),
    ]);
    setIsRefreshing(false);
  }, [adminSocietyId]);

  // Bulk reject reuses the single-item reason modal; the reason entered there is
  // applied to every selected request (see handleRejectSubmit's bulk branch).
  const handleBulkReject = useCallback(() => {
    if (selectedRequests.size === 0) return;
    setRejectingId(null);
    setRejectingType(null);
    setIsBulkReject(true);
    setShowRejectModal(true);
  }, [selectedRequests.size]);

  // No bulk endpoint exists, so this drives the same per-item approve path —
  // but refetches and reports once for the whole batch rather than once per
  // item, and reports partial failure the same way bulk reject does.
  const handleBulkApprove = useCallback(async () => {
    const ids = Array.from(selectedRequests);
    if (ids.length === 0) return;
    setIsBulkApproving(true);
    let failed = 0;
    try {
      for (const id of ids) {
        const req = displayData.requests.find((r) => r.id === id);
        if (!req?.type) continue;
        try {
          await approveOne(id, req.type);
        } catch (error) {
          failed += 1;
          console.error("Failed to approve:", id, error);
        }
      }
      const sid = resolveSid();
      if (sid) await getAllPendingContent(sid);
      setSelectedRequests(new Set());

      if (failed > 0) {
        Alert.alert(
          "Some Approvals Failed",
          `${ids.length - failed} of ${ids.length} were approved. Please retry the rest.`,
        );
      } else {
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);
      }
    } finally {
      setIsBulkApproving(false);
    }
  }, [
    selectedRequests,
    displayData.requests,
    approveOne,
    resolveSid,
    getAllPendingContent,
  ]);

  // ── Society selector ──────────────────────────────────────────────────────────
  const openSocietySelector = useCallback(() => {
    if (societies.length === 0) getAllSociety();
    setSocietySelectorVisible(true);
  }, [societies.length]);

  const closeSocietySelector = useCallback(() => {
    setSocietySelectorVisible(false);
    setSocietySearch("");
  }, []);

  const handleSelectSociety = useCallback(async (item: Society) => {
    setAdminSociety(item);
    setSocietySelectorVisible(false);
    setSocietySearch("");
    setIsFetchingSocietyData(true);
    await Promise.allSettled([
      getAllPendingContent(item._id),
      getAllApprovedContent(item._id),
      getAllReportedContent(item._id),
    ]);
    setIsFetchingSocietyData(false);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <SafeAreaProvider>
        <View style={[styles.root, { paddingTop: topPadding }]}>
          {isInitialLoading ? (
            <DashboardSkeleton />
          ) : !adminSociety ? (
            isSuperAdmin ? (
              <Pressable
                style={styles.noSocietyContainer}
                onPress={openSocietySelector}
              >
                <EmptyState
                  icon="business-outline"
                  title="No Society Selected"
                  subtitle="Tap here to select a society before performing any actions"
                />
              </Pressable>
            ) : (
              <View style={styles.noSocietyContainer}>
                <EmptyState
                  icon="business-outline"
                  title="No Society Found"
                  subtitle="Your society could not be loaded. Please contact support."
                />
              </View>
            )
          ) : (
            <ScrollView
              style={[
                styles.container,
                { backgroundColor: t.colors.background },
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={t.colors.primary}
                  colors={[t.colors.primary]}
                  progressBackgroundColor={t.colors.surface}
                />
              }
            >
              <DashboardHeader
                isSuperAdmin={isSuperAdmin}
                selectedSociety={adminSociety}
                onSocietyPress={openSocietySelector}
              />

              <StatsSection
                stats={verificationStats}
                selectedCard={selectedStatsCard}
                onPendingPress={handlePendingRequestsClick}
                onApprovedResidentsPress={handleApprovedResidentsClick}
                onApprovedBusinessPress={handleApprovedBusinessClick}
                onApprovedServicesPress={handleApprovedServicesClick}
                onReportedContentsPress={handleReportedContentsClick}
              />

              {currentView === "main" && (
                <PendingRequestsSection
                  requests={displayData.requests}
                  allRequestsSelected={allRequestsSelected}
                  isRequestSelected={isRequestSelected}
                  activeFilter={selectedEntityType}
                  counts={{
                    all: pendingContent.totalCount,
                    user: pendingContent.residents?.total ?? 0,
                    business: pendingContent.businesses?.total ?? 0,
                    service: pendingContent.dailyServices?.total ?? 0,
                  }}
                  onFilterChange={handleFilterChange}
                  onSelectAll={handleSelectAll}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSelectionChange={handleRequestSelect}
                />
              )}

              {currentView === "approved" && (
                <ApprovedResidentsView
                  approvedUsers={approvedContent.residents?.items ?? []}
                  towerList={towerList}
                />
              )}
              {currentView === "business" && (
                <ApprovedBusinessView
                  approvedBusinesses={approvedContent.businesses?.items ?? []}
                />
              )}
              {currentView === "services" && (
                <ApprovedDailyServicesView
                  approvedServices={approvedContent.dailyServices?.items ?? []}
                />
              )}
              {currentView === "reported-contents" && (
                <ReportedContentsView
                  users={reportedContent.users}
                  businesses={reportedContent.businesses}
                  feeds={reportedContent.feeds}
                  deals={reportedContent.deals}
                  dailyServices={reportedContent.dailyServices}
                />
              )}

              <View style={styles.bottomSpacer} />
            </ScrollView>
          )}

          {selectedRequests.size > 0 && currentView === "main" && (
            <BulkActionBar
              selectedCount={selectedRequests.size}
              onBulkReject={handleBulkReject}
              onBulkApprove={handleBulkApprove}
              isBusy={isBulkApproving || isRejecting}
            />
          )}

          <RejectModal
            visible={showRejectModal}
            onClose={handleRejectModalClose}
            onSubmit={handleRejectSubmit}
            title="Rejection Reason"
            isLoading={isRejecting}
          />

          <OrderSuccessModal
            visible={showSuccessModal}
            onDismiss={handleSuccessDismiss}
            title="Success!"
            subtitle="Request has been updated."
            autoHideMs={1500}
          />
        </View>
      </SafeAreaProvider>

      {isFetchingSocietyData && <FetchingOverlay />}

      <SocietySelectorModal
        visible={societySelectorVisible}
        societies={societies}
        selectedSociety={adminSociety}
        search={societySearch}
        onSearchChange={setSocietySearch}
        onClose={closeSocietySelector}
        onSelectSociety={handleSelectSociety}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  bottomSpacer: { height: 40 },
  noSocietyContainer: { flex: 1, justifyContent: "center" },
});
