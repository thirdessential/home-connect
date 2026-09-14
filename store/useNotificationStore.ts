import { Get, Patch } from "@/lib/httpMethods";
import { create } from "zustand";

export type AppNotification = {
    id: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    receivedAt: string; // ISO
    read: boolean;
};

type NotificationStore = {
    items: AppNotification[];
    loading: boolean;
    error: string | null;
    fetchAll: () => Promise<void>;
    /** Live push arrival — server is still the source of truth on next fetch. */
    add: (n: Omit<AppNotification, "read" | "id"> & { id?: string }) => void;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
};

// Backend (GET/PATCH /api/notification/user...) is now the source of truth.
// `add` only gives immediate UI feedback for a just-arrived push; the next
// focus/fetch reconciles with MySQL.
export const useNotificationStore = create<NotificationStore>()((set, get) => ({
    items: [],
    loading: false,
    error: null,

    fetchAll: async () => {
        set({ loading: true, error: null });
        try {
            const res = await Get<{ success: boolean; notifications: any[] }>("/api/notification/user");
            const items: AppNotification[] = (res?.notifications || []).map((n: any) => ({
                id: String(n.id ?? n._id),
                title: n.title ?? "Notification",
                body: n.body ?? n.message ?? "",
                data: n.data,
                receivedAt: n.createdAt ?? n.created_at ?? new Date().toISOString(),
                read: !!(n.read ?? n.isRead ?? n.is_read),
            }));
            const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000; // 15-day history window
            const recent = items.filter((i) => new Date(i.receivedAt).getTime() >= cutoff);
            recent.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
            set({ items: recent, loading: false });
        } catch (err: any) {
            set({ error: err?.message || "Failed to load notifications", loading: false });
        }
    },

    add: (n) =>
        set((s) => {
            const id = n.id ?? `local-${Date.now()}`;
            if (s.items.some((i) => i.id === id)) return s; // no duplicate ids
            return { items: [{ ...n, id, read: false }, ...s.items] };
        }),

    markRead: async (id) => {
        const prev = get().items;
        set({ items: prev.map((i) => (i.id === id ? { ...i, read: true } : i)) });
        try {
            await Patch(`/api/notification/user/${id}/read`, {});
        } catch {
            set({ items: prev }); // revert on failure
        }
    },

    markAllRead: async () => {
        if (get().loading) return; // prevent duplicate requests
        const prev = get().items;
        if (prev.every((i) => i.read)) return;
        set({ items: prev.map((i) => ({ ...i, read: true })) });
        try {
            await Patch("/api/notification/user/read-all", {});
        } catch {
            set({ items: prev });
        }
    },
}));
