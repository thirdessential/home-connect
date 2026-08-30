import {
  HOME_DUMMY_FORCE,
  HOME_DUMMY_MODE,
  useHomeDummyStore,
} from "@/assets/mocks/homeDummyData";
import { usePermissions } from "@/hooks/usePermissions";
import { formatPostTime } from "@/lib/dateTime";
import { useEventStore } from "@/store/useEventStore";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useUserStore } from "@/store/useUserStore";
import { FeedItem } from "@/types/feeds.type";
import { HomeFeedActions, HomeFeedItem } from "@/types/homeFeed.type";
import { UserRole } from "@/types/roles";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { Alert } from "react-native";

// No existing grey placeholder-avatar asset was found in the project — this
// is a neutral solid-grey inline data URI rather than a new asset file.
const GUEST_AVATAR_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

// Strips creator identity for Guest viewers — same shape, no card changes
// needed. Attendee lists (event "who's joining") are left as-is: the spec
// scopes this to the post/poll/event *creator*, not other residents' RSVPs.
function anonymizeForGuest(item: HomeFeedItem): HomeFeedItem {
  return {
    ...item,
    author: {
      name: "Anonymous User",
      avatarUrl: GUEST_AVATAR_URI,
      initials: "?",
      verified: false,
      isAnonymous: true,
    },
    canInteract: false,
  };
}

const initialsOf = (name?: string) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const idOf = (v: any) => (typeof v === "string" ? v : v?._id ?? v?.userId ?? null);

/** "2026-08-15" | ISO -> "Fri, 15 Aug" */
const formatEventDate = (raw?: string) => {
  if (!raw) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw));
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(raw);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

/** "19:00" | "19:00:00" | ISO -> "7:00 PM" */
const formatEventTime = (raw?: string) => {
  if (!raw) return undefined;
  const str = String(raw);
  const m = /(\d{1,2}):(\d{2})/.exec(str.includes("T") ? str.split("T")[1] ?? str : str);
  if (!m) return undefined;
  let h = Number(m[1]);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${suffix}`;
};

/** Maps one real API feed item into the shape the Home cards render. */
function toHomeFeedItem(f: FeedItem, currentUserId?: string): HomeFeedItem {
  const user: any = typeof f.user === "object" && f.user ? f.user : {};
  const images = Array.isArray(f.images) ? f.images.filter(Boolean) : [];
  const kind = f.type === "poll" ? "poll" : f.type === "event" ? "event" : "post";
  const rsvps: any[] = Array.isArray(f.rsvps) ? f.rsvps : [];
  const eventParticipants: any[] = Array.isArray(f.eventParticipants) ? f.eventParticipants : [];
  // Real (mysqlEventId) events join via the Event API into event_participants
  // — feed_rsvps is a separate, legacy table nothing writes to for them. Use
  // the real participant list when there is one; fall back to feed_rsvps only
  // for pre-migration legacy events.
  const participants = f.mysqlEventId != null ? eventParticipants : rsvps;
  const votes: any[] = Array.isArray(f.votes) ? f.votes : [];
  const myVote = votes.find((v) => idOf(v.userId) === currentUserId);

  return {
    id: f._id,
    kind,
    mysqlEventId: f.mysqlEventId ?? null,
    createdAtMs: f.createdAt ? new Date(f.createdAt).getTime() : 0,
    author: {
      name: user.fullName || "Resident",
      avatarUrl: user.profilePhotoUrl,
      initials: initialsOf(user.fullName),
      verified: user?.isAddressVerified?.status === "approved",
    },
    meta: [f.towerName, f.flatNo, formatPostTime(f.createdAt ?? "")]
      .filter(Boolean)
      .join(" • "),
    isPublic: true,
    canInteract: true,
    isOwner: !!currentUserId && idOf(f.user) === currentUserId,
    image: images[0],
    title: f.title,
    description: f.description || f.content,
    category: f.category ?? undefined,
    eventDate: formatEventDate(f.eventDate),
    eventTime: formatEventTime(f.eventTime),
    location: f.location,
    // Same array attendees/isJoined use below — count can never disagree with the list.
    joined: participants.length,
    capacity: f.maxParticipants ? Number(f.maxParticipants) : undefined,
    minParticipants: f.minParticipants ? Number(f.minParticipants) : undefined,
    attendees: participants.map((p, i) => ({
      id: `${f._id}-participant-${idOf(p.userId) ?? i}-${i}`,
      name: p?.fullName || "Resident",
      avatarUrl: p?.profilePhotoUrl,
    })),
    isJoined: participants.some((p) => idOf(p.userId) === currentUserId),
    options: (() => {
      const seen = new Set<string>();
      return (f.options ?? []).map((o: any, index: number) => {
        const raw = o?.id ?? o?._id ?? o?.optionId;
        let id = raw != null && String(raw).length ? String(raw) : `${f._id}-option-${index}`;
        // A repeated id would still collide as a React key.
        if (seen.has(id)) id = `${id}-${index}`;
        seen.add(id);
        return {
          id,
          name: o?.name ?? o?.optionName ?? `Option ${index + 1}`,
          votes:
            votes.filter((v) => String(v.optionId) === String(raw ?? id)).length ||
            o?.votes ||
            0,
        };
      });
    })(),
    totalVotes: votes.length || f.totalVotes || 0,
    votedOptionId: myVote?.optionId ?? null,
    likeCount: f.likes?.length ?? 0,
    isLiked: (f.likes ?? []).some((l: any) => idOf(l) === currentUserId),
    commentCount: f.comments?.length ?? 0,
    comments: (f.comments ?? []).map((c: any, i: number) => ({
      id: String(c?._id ?? i),
      author: c?.user?.fullName || "Resident",
      avatarUrl: c?.user?.profilePhotoUrl,
      text: c?.text ?? "",
      createdAt: formatPostTime(c?.createdAt ?? ""),
    })),
  };
}

/**
 * Single source of truth for the Home feed.
 *
 *   real API has items  → real data + real store actions
 *   real API is empty   → isolated dummy data + dummy actions
 *
 * Cards only ever see `items` + `actions`, so removing the dummy layer is a
 * one-line change here and needs no card edits.
 */
export function useHomeFeed(): {
  items: HomeFeedItem[];
  actions: HomeFeedActions;
  isDummy: boolean;
} {
  const feeds = useFeedsStore((s) => s.feeds);
  const toggleLikeApi = useFeedsStore((s) => s.toggleLike);
  const votePollApi = useFeedsStore((s) => s.votePoll);
  const addCommentApi = useFeedsStore((s) => s.addComment);
  const removeFeedApi = useFeedsStore((s) => s.removeFeed);
  const joinEventApi = useEventStore((s) => s.joinEvent);
  const user = useUserStore((s) => s.user);
  // Same JWT-derived role source PostCard/PollCard/ProductCard already gate
  // guest interactions with — not a new/invented role check.
  const isGuest = usePermissions().hasRole(UserRole.GUEST);

  const dummyItems = useHomeDummyStore((s) => s.items);
  const dummyLike = useHomeDummyStore((s) => s.toggleLike);
  const dummyVote = useHomeDummyStore((s) => s.vote);
  const dummyRsvp = useHomeDummyStore((s) => s.toggleRsvp);
  const dummyComment = useHomeDummyStore((s) => s.addComment);
  const dummyDelete = useHomeDummyStore((s) => s.deleteItem);

  const realItems = useMemo(
    () =>
      feeds
        // A legacy feed-event predates the Event API migration and has no
        // mysqlEventId — it can never be opened or joined (see toggleRsvp's
        // guard below), so it's filtered out of Home rather than shown as a
        // dead card. Posts/polls are untouched.
        .filter((f) => f.type !== "event" || f.mysqlEventId != null)
        .map((f) => toHomeFeedItem(f, user?._id))
        .map((item) => (isGuest ? anonymizeForGuest(item) : item)),
    [feeds, user?._id, isGuest],
  );

  // Dummy only renders when explicitly forced on for development — a real
  // user with a genuinely empty feed sees the empty state, never silent
  // placeholder content. Toggle HOME_DUMMY_FORCE in homeDummyData.ts.
  const isDummy = HOME_DUMMY_MODE && HOME_DUMMY_FORCE;

  const realActions = useMemo<HomeFeedActions>(
    () => ({
      toggleLike: (id) => {
        if (user?._id) toggleLikeApi(id, user._id);
      },
      vote: (id, optionId) => {
        if (user?._id) votePollApi(id, optionId, user._id);
      },
      toggleRsvp: async (id) => {
        const item = realItems.find((i) => i.id === id);
        if (!item) return;

        if (!item.mysqlEventId) {
          // Predates the Event API migration — same guard ProductCard uses.
          Alert.alert(
            "Event unavailable",
            "This event was created on an older version of the app and can no longer be opened.",
          );
          return;
        }

        try {
          await joinEventApi(item.mysqlEventId);
        } catch (e: any) {
          // "already joined" from a repeat tap isn't a real failure — still navigate.
          const msg = String(e?.message ?? "").toLowerCase();
          if (!msg.includes("already")) {
            Alert.alert("Join failed", e?.message ?? "Could not join this event.");
            return;
          }
        }
        router.navigate(`/(shared)/event-details?eventId=${item.mysqlEventId}`);
      },
      addComment: async (id, text) => {
        if (user?._id) await addCommentApi(id, { userId: user._id, text });
      },
      deleteItem: async (id) => {
        const ok = await removeFeedApi(id);
        if (!ok) {
          throw new Error(useFeedsStore.getState().error || "Failed to delete. Please try again.");
        }
      },
    }),
    [user, realItems, toggleLikeApi, votePollApi, joinEventApi, addCommentApi, removeFeedApi],
  );

  const dummyActions = useMemo<HomeFeedActions>(
    () => ({
      toggleLike: dummyLike,
      vote: dummyVote,
      toggleRsvp: dummyRsvp,
      addComment: dummyComment,
      deleteItem: dummyDelete,
    }),
    [dummyLike, dummyVote, dummyRsvp, dummyComment, dummyDelete],
  );

  const sortedItems = useMemo(() => {
    const src = isDummy
      ? isGuest
        ? dummyItems.map(anonymizeForGuest)
        : dummyItems
      : realItems;
    return [...src].sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [isDummy, isGuest, dummyItems, realItems]);

  return {
    items: sortedItems,
    actions: isDummy ? dummyActions : realActions,
    isDummy,
  };
}

/**
 * Client-side filter backing the Home chips.
 *
 * Backend note: the feed API has exactly one `type: "post"` — there is no
 * separate "update" category server-side ("Updates" is only marketing copy
 * on the compose sheet). So "Updates" and "Posts" are not currently
 * distinguishable and both show every `kind === "post"` item. Reported in
 * the task response rather than inventing a fake split (e.g. by image
 * presence, which would just reintroduce the just-removed Photos filter).
 */
export const filterHomeFeed = (items: HomeFeedItem[], filter: string) => {
  if (filter === "all") return items;
  if (filter === "events") return items.filter((i) => i.kind === "event");
  if (filter === "polls") return items.filter((i) => i.kind === "poll");
  if (filter === "updates" || filter === "posts")
    return items.filter((i) => i.kind === "post");
  return items;
};

export const useHomeFeedCallbackNoop = () => useCallback(() => {}, []);
