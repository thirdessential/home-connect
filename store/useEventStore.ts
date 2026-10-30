// Store for the new MySQL-based Event API (home-connect-server
// src/routes/event.routes.js). Mirrors the pattern already used by
// useBusinessRegistrationStore. No mock data — every call hits the real API.

import { API_BASE, Delete, Get, Patch, Post, Put } from "@/lib/httpMethods";
import { getToken } from "@/lib/tokenManager";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import {
  CreateEventPayload,
  EventComment,
  EventDashboard,
  EventDetail,
  EventParticipant,
  EventRecord,
  EventJoinRequest,
  EventReport,
} from "@/types/event.type";
import { create } from "zustand";

type EventImageFile = { uri: string; name: string; type: string }[];

async function createEventMultipart(
  payload: CreateEventPayload,
  image: EventImageFile,
): Promise<{ event: EventDetail }> {
  const token = getToken();
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  image.forEach((f) => form.append("eventimage", { uri: f.uri, name: f.name, type: f.type } as any));
  const r = await fetch(`${API_BASE}/api/events`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const json: any = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err: any = new Error(json?.error || `HTTP ${r.status}`);
    err.status = r.status;
    err.body = json;
    throw err;
  }
  return json;
}

type State = {
  currentEvent: EventDetail | null;
  myEvents: EventRecord[];
  participants: EventParticipant[];
  cancelledParticipants: EventParticipant[];
  dashboard: EventDashboard | null;
  comments: EventComment[];
  commentsLoading: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
};

type Actions = {
  createEvent: (payload: CreateEventPayload, image: EventImageFile) => Promise<EventDetail>;
  getEvent: (eventId: number | string) => Promise<EventDetail>;
  getMyEvents: () => Promise<EventRecord[]>;
  /** One page of "created" or "joined" events for a timeline phase (upcoming|ongoing|completed|cancelled). Stateless (does not touch myEvents). */
  fetchEventPage: (
    kind: "created" | "joined",
    phase: string,
    page: number,
    limit?: number,
  ) => Promise<{ events: EventRecord[]; hasMore: boolean; total: number }>;
  joinEvent: (eventId: number | string) => Promise<void>;
  getParticipants: (eventId: number | string) => Promise<EventParticipant[]>;
  getCancelledParticipants: (eventId: number | string) => Promise<EventParticipant[]>;
  getDashboard: (eventId: number | string) => Promise<EventDashboard>;
  /** PATCH /cancel — title (<=70) and reason (<=300) are both required by the server. */
  cancelEvent: (eventId: number | string, details: { title: string; reason: string }) => Promise<void>;
  /** DELETE /api/admin/events/:ref — admin permanent delete of a COMPLETED event; throws on failure. */
  adminDeleteEvent: (eventRef: number | string) => Promise<void>;
  cancelParticipant: (eventId: number | string, userId: string) => Promise<void>;
  /** PATCH /close — active → closed (registration only; not a cancellation). */
  closeRegistration: (eventId: number | string) => Promise<void>;
  /** PATCH /complete — server rejects before start with 409 EVENT_NOT_STARTED. */
  completeEvent: (eventId: number | string) => Promise<void>;
  /** PATCH /delay — body { minutes } where minutes ∈ {10,30,60}. */
  delayEvent: (eventId: number | string, minutes: number) => Promise<void>;
  /** POST /:id/reminders/send — resolves only on server-confirmed delivery request. */
  sendReminderNow: (eventId: number | string) => Promise<void>;
  /** PATCH /:id/start — organizer starts an eligible upcoming event. */
  startEventNow: (eventId: number | string) => Promise<void>;
  /** PUT /reminders — body { reminders } of minutes-before-start. */
  setEventReminders: (eventId: number | string, reminders: number[]) => Promise<void>;
  /** POST /:id/join-requests — only valid while the server reports the event housefull. */
  requestToJoin: (eventId: number | string) => Promise<EventDetail["joinRequest"]>;
  /** GET /my-join-requests — caller's pending/rejected requests as events (each carries `joinRequest`). */
  getMyJoinRequests: () => Promise<EventRecord[]>;
  getJoinRequests: (eventId: number | string) => Promise<{ requests: EventJoinRequest[]; pendingCount: number }>;
  /** PATCH approve/reject — approve re-checks capacity on the server under a row lock. */
  reviewJoinRequest: (eventId: number | string, requestId: number, action: "approve" | "reject") => Promise<{ pendingCount: number; joinedCount: number }>;
  /** POST /:id/reports — joined participants only. */
  submitEventReport: (eventId: number | string, title: string, description: string) => Promise<EventReport>;
  getEventReports: (eventId: number | string) => Promise<EventReport[]>;
  updateEventReportStatus: (eventId: number | string, reportId: number | string, status: EventReport["status"]) => Promise<EventReport>;
  toggleLike: (eventId: number | string) => Promise<{ liked: boolean; likeCount: number }>;
  getComments: (eventId: number | string) => Promise<EventComment[]>;
  addComment: (eventId: number | string, text: string) => Promise<EventComment[]>;
  deleteComment: (eventId: number | string, commentId: number | string) => Promise<EventComment[]>;
  clear: () => void;
};

// Shared by close/complete/delay/reminders: sets `saving`, and mirrors the
// server-returned event into an open details screen only after success.
async function runLifecycle(
  set: (fn: Partial<State> | ((st: State) => Partial<State>)) => void,
  eventId: number | string,
  call: () => Promise<{ event?: EventDetail }>,
) {
  set({ saving: true, error: null });
  try {
    const res = await call();
    set((st) =>
      res?.event && st.currentEvent && String(st.currentEvent.id) === String(eventId)
        ? { currentEvent: { ...st.currentEvent, ...res.event } }
        : {},
    );
  } catch (e: any) {
    set({ error: e?.message ?? "Request failed" });
    throw e;
  } finally {
    set({ saving: false });
  }
}

export const useEventStore = create<State & Actions>((set) => ({
  currentEvent: null,
  myEvents: [],
  participants: [],
  cancelledParticipants: [],
  dashboard: null,
  comments: [],
  commentsLoading: false,
  loading: false,
  saving: false,
  error: null,

  createEvent: async (payload, image) => {
    set({ saving: true, error: null });
    try {
      const res = await createEventMultipart(payload, image);
      set({ currentEvent: res.event });

      const selectedSocietyId = useSocietyStore.getState().selectedSociety?._id;
      if (selectedSocietyId) {
        await useFeedsStore.getState().fetchFeedsBySociety(selectedSocietyId, true);
      }

      return res.event;
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to create event" });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  getEvent: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const res = await Get<{ event: EventDetail }>(`/api/events/${eventId}`);
      set({ currentEvent: res.event });
      return res.event;
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to load event" });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  getMyEvents: async () => {
    set({ loading: true, error: null });
    try {
      const res = await Get<{ events: EventRecord[] }>(`/api/events/my-events`);
      set({ myEvents: res.events ?? [] });
      return res.events ?? [];
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to load your events" });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  fetchEventPage: async (kind, phase, page, limit = 10) => {
    const path = kind === "created" ? "my-events" : "joined-events";
    const res = await Get<{ events: EventRecord[]; hasMore?: boolean; total?: number }>(
      `/api/events/${path}?phase=${encodeURIComponent(phase)}&page=${page}&limit=${limit}`,
    );
    return { events: res.events ?? [], hasMore: !!res.hasMore, total: res.total ?? 0 };
  },

  joinEvent: async (eventId) => {
    set({ saving: true, error: null });
    try {
      await Post(`/api/events/${eventId}/join`, {});
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to join event" });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  getParticipants: async (eventId) => {
    const res = await Get<{ participants: EventParticipant[] }>(
      `/api/events/${eventId}/participants`,
    );
    set({ participants: res.participants ?? [] });
    return res.participants ?? [];
  },

  getCancelledParticipants: async (eventId) => {
    const res = await Get<{ participants: EventParticipant[] }>(
      `/api/events/${eventId}/participants?status=cancelled`,
    );
    set({ cancelledParticipants: res.participants ?? [] });
    return res.participants ?? [];
  },

  getDashboard: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const res = await Get<EventDashboard & { success: boolean }>(
        `/api/events/${eventId}/dashboard`,
      );
      set({ dashboard: res });
      return res;
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to load dashboard" });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  adminDeleteEvent: async (eventRef) => {
    await Delete(`/api/admin/events/${eventRef}`);
    // Only after the server confirmed: drop an open details screen's copy.
    set((st) => (st.currentEvent && String(st.currentEvent.id) === String(eventRef) ? { currentEvent: null } : {}));
  },

  cancelEvent: async (eventId, { title, reason }) => {
    set({ saving: true, error: null });
    try {
      const res = await Patch<{ event?: EventDetail }>(`/api/events/${eventId}/cancel`, { title, reason });
      // Only after the server confirmed: mirror the new status into an open details screen.
      set((st) =>
        res?.event && st.currentEvent && String(st.currentEvent.id) === String(eventId)
          ? { currentEvent: { ...st.currentEvent, ...res.event } }
          : {},
      );
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to cancel event" });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  closeRegistration: async (eventId) => {
    await runLifecycle(set, eventId, () => Patch<{ event?: EventDetail }>(`/api/events/${eventId}/close`, {}));
  },

  completeEvent: async (eventId) => {
    await runLifecycle(set, eventId, () => Patch<{ event?: EventDetail }>(`/api/events/${eventId}/complete`, {}));
  },

  sendReminderNow: async (eventId) => {
    await runLifecycle(set, eventId, () => Post<{ event?: EventDetail }>(`/api/events/${eventId}/reminders/send`, {}));
  },

  startEventNow: async (eventId) => {
    await runLifecycle(set, eventId, () => Patch<{ event?: EventDetail }>(`/api/events/${eventId}/start`, {}));
  },

  delayEvent: async (eventId, minutes) => {
    await runLifecycle(set, eventId, () => Patch<{ event?: EventDetail }>(`/api/events/${eventId}/delay`, { minutes }));
  },

  setEventReminders: async (eventId, reminders) => {
    await runLifecycle(set, eventId, () =>
      Put<{ event?: EventDetail }>(`/api/events/${eventId}/reminders`, { reminders }),
    );
  },

  requestToJoin: async (eventId) => {
    const res = await Post<{ request: EventDetail["joinRequest"] }>(`/api/events/${eventId}/join-requests`, {});
    set((st) =>
      st.currentEvent && String(st.currentEvent.id) === String(eventId)
        ? { currentEvent: { ...st.currentEvent, joinRequest: res.request } }
        : {},
    );
    return res.request;
  },

  getMyJoinRequests: async () => {
    const res = await Get<{ events: EventRecord[] }>(`/api/events/my-join-requests`);
    return res.events ?? [];
  },

  getJoinRequests: async (eventId) => {
    const res = await Get<{ requests: EventJoinRequest[]; pendingCount: number }>(`/api/events/${eventId}/join-requests?status=pending`);
    return { requests: res.requests ?? [], pendingCount: Number(res.pendingCount ?? 0) };
  },

  reviewJoinRequest: async (eventId, requestId, action) => {
    const res = await Patch<{ pendingCount: number; joinedCount: number }>(
      `/api/events/${eventId}/join-requests/${requestId}/${action}`,
      action === "reject" ? { reason: "" } : {},
    );
    return { pendingCount: Number(res.pendingCount ?? 0), joinedCount: Number(res.joinedCount ?? 0) };
  },

  submitEventReport: async (eventId, title, description) => {
    const res = await Post<{ report: EventReport }>(`/api/events/${eventId}/reports`, { title, description });
    return res.report;
  },

  getEventReports: async (eventId) => {
    const res = await Get<{ reports: EventReport[] }>(`/api/events/${eventId}/reports`);
    return res.reports ?? [];
  },

  updateEventReportStatus: async (eventId, reportId, status) => {
    const res = await Patch<{ report: EventReport }>(`/api/events/${eventId}/reports/${reportId}`, { status });
    return res.report;
  },

  cancelParticipant: async (eventId, userId) => {
    set({ saving: true, error: null });
    try {
      await Patch(`/api/events/${eventId}/participants/${userId}/cancel`, {});
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to cancel participant" });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  // PATCH /api/events/:id/like — the response is the source of truth for both
  // the liked flag and the count; nothing is tracked locally.
  toggleLike: async (eventId) => {
    const res = await Patch<{ liked: boolean; likeCount: number }>(
      `/api/events/${eventId}/like`,
      {},
    );
    return { liked: !!res.liked, likeCount: Number(res.likeCount ?? 0) };
  },

  // All three comment endpoints return the full, current comment list.
  getComments: async (eventId) => {
    set({ commentsLoading: true, error: null });
    try {
      const res = await Get<{ comments: EventComment[] }>(`/api/events/${eventId}/comments`);
      const comments = res.comments ?? [];
      set({ comments });
      return comments;
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to load comments" });
      throw e;
    } finally {
      set({ commentsLoading: false });
    }
  },

  addComment: async (eventId, text) => {
    const res = await Post<{ comments: EventComment[] }>(
      `/api/events/${eventId}/comments`,
      { text },
    );
    const comments = res.comments ?? [];
    set({ comments });
    return comments;
  },

  deleteComment: async (eventId, commentId) => {
    const res = await Delete<{ comments: EventComment[] }>(
      `/api/events/${eventId}/comments/${commentId}`,
    );
    const comments = res.comments ?? [];
    set({ comments });
    return comments;
  },

  clear: () =>
    set({
      currentEvent: null,
      participants: [],
      cancelledParticipants: [],
      dashboard: null,
      comments: [],
      error: null,
    }),
}));
