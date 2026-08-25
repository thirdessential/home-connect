// Store for the new MySQL-based Event API (home-connect-server
// src/routes/event.routes.js). Mirrors the pattern already used by
// useBusinessRegistrationStore. No mock data — every call hits the real API.

import { API_BASE, Delete, Get, Patch, Post } from "@/lib/httpMethods";
import { getToken } from "@/lib/tokenManager";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import {
  CreateEventPayload,
  EventComment,
  EventDashboard,
  EventDetail,
  EventParticipant,
} from "@/types/event.type";
import { create } from "zustand";

type EventImageFile = { uri: string; name: string; type: string } | null;

async function createEventMultipart(
  payload: CreateEventPayload,
  image: EventImageFile,
): Promise<{ event: EventDetail }> {
  const token = getToken();
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  if (image) {
    form.append("eventimage", { uri: image.uri, name: image.name, type: image.type } as any);
  }
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
  participants: EventParticipant[];
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
  joinEvent: (eventId: number | string) => Promise<void>;
  getParticipants: (eventId: number | string) => Promise<EventParticipant[]>;
  getDashboard: (eventId: number | string) => Promise<EventDashboard>;
  cancelEvent: (eventId: number | string) => Promise<void>;
  toggleLike: (eventId: number | string) => Promise<{ liked: boolean; likeCount: number }>;
  getComments: (eventId: number | string) => Promise<EventComment[]>;
  addComment: (eventId: number | string, text: string) => Promise<EventComment[]>;
  deleteComment: (eventId: number | string, commentId: number | string) => Promise<EventComment[]>;
  clear: () => void;
};

export const useEventStore = create<State & Actions>((set) => ({
  currentEvent: null,
  participants: [],
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

  cancelEvent: async (eventId) => {
    set({ saving: true, error: null });
    try {
      await Patch(`/api/events/${eventId}/cancel`, {});
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to cancel event" });
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
    set({ currentEvent: null, participants: [], dashboard: null, comments: [], error: null }),
}));
