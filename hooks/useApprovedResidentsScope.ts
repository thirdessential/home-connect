import { useAdminStore } from "@/store/useAdminStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { Society } from "@/types/society.type";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/**
 * Society-scoped approved residents for the dedicated Approved Residents pages.
 * Data comes from GET /api/admin/approved/:societyId (the backend authorizes the
 * society); it is refetched whenever the page regains focus so counts stay fresh
 * after approvals. `ready` stays false until the first fetch for this society ends,
 * so "no towers / no residents" never flashes before the response.
 */
export function useApprovedResidentsScope(societyId?: string, fallbackName?: string) {
  const residents = useAdminStore((s) => s.approvedContent.residents?.items ?? []);
  const error = useAdminStore((s) => s.approvedContentError);
  const getAllApprovedContent = useAdminStore((s) => s.getAllApprovedContent);
  const societies = useSocietyStore((s) => s.societies);
  const ownSociety = useSocietyStore((s) => s.selectedSociety);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const society: Society | undefined =
    (societies.find((s) => s._id === societyId) as Society | undefined) ??
    (ownSociety?._id === societyId ? (ownSociety as Society) : undefined);

  const load = useCallback(async () => {
    if (!societyId) return;
    await getAllApprovedContent(societyId);
    setLoadedFor(societyId);
  }, [societyId, getAllApprovedContent]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return {
    residents,
    towers: society?.towers ?? [],
    societyName: society?.name ?? fallbackName ?? null,
    ready: !!societyId && loadedFor === societyId,
    error,
    reload: load,
  };
}
