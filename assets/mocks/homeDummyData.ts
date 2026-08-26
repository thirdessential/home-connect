// ─────────────────────────────────────────────────────────────────────────────
// ISOLATED HOME DUMMY LAYER — delete this file and flip HOME_DUMMY_MODE to
// false to remove it entirely. Nothing here touches a production store or a
// real endpoint; it exists only so every Home card state in the design
// reference can be demonstrated while the feed API is still incomplete.
// ─────────────────────────────────────────────────────────────────────────────
import { HomeFeedItem } from "@/types/homeFeed.type";
import { create } from "zustand";

/**
 * Master switch. `true` renders the reference dataset below; `false` falls
 * back to the real feed store. Home also falls back automatically whenever the
 * real API returns items, so this only controls the empty-API case.
 */
export const HOME_DUMMY_MODE = true;

/**
 * When true the reference dataset renders even if the feed API returned rows —
 * needed while the API's rows lack the fields the reference UI shows (tower,
 * flat, category, poll option ids). Set to false to always prefer real data;
 * the empty-feed fallback still applies.
 */
export const HOME_DUMMY_FORCE = true;

const AVATAR_AARAV =
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80";
const AVATAR_NEHA =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80";
const AVATAR_ROHAN =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80";
const AVATAR_VIKRAM =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80";
const AVATAR_ADMIN =
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&q=80";
const HERO_CRICKET =
  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80";
const PHOTO_GARDEN =
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&q=80";

// Fixed reference instant so the dataset's relative-time labels stay
// consistent — a dev/demo dataset, not a live clock.
const NOW = Date.parse("2026-08-25T18:00:00.000Z");
const hoursAgo = (h: number) => NOW - h * 60 * 60 * 1000;
const minsAgo = (m: number) => NOW - m * 60 * 1000;

// Array order is deliberately scrambled relative to createdAtMs — if the All
// tab ever renders in insertion order instead of sorting, this dataset makes
// that regression visible immediately (see the useHomeFeed sort test).
export const HOME_DUMMY_FEED: HomeFeedItem[] = [
  {
    id: "dummy-poll-2",
    kind: "poll",
    createdAtMs: hoursAgo(8),
    author: {
      name: "Society Admin Team",
      avatarUrl: AVATAR_ADMIN,
      initials: "SA",
      verified: true,
    },
    meta: "Official • 8h ago",
    isPublic: true,
    title: "What time should we host the Diwali celebration?",
    options: [
      { id: "dummy-poll-2-o1", name: "Evening (6 PM)", votes: 40 },
      { id: "dummy-poll-2-o2", name: "Night (8 PM)", votes: 55 },
      { id: "dummy-poll-2-o3", name: "Morning (10 AM)", votes: 15 },
    ],
    totalVotes: 110,
    pollEndsLabel: "Poll ends in 5 days",
    votedOptionId: "dummy-poll-2-o1",
    likeCount: "18",
    isLiked: false,
    commentCount: 3,
    comments: [
      {
        id: "c6",
        author: "Kanika",
        avatarUrl: AVATAR_NEHA,
        text: "Evening works best for most families.",
        createdAt: "6h ago",
      },
    ],
  },
  {
    id: "dummy-event-1",
    kind: "event",
    createdAtMs: hoursAgo(2),
    author: {
      name: "Aarav Mehta",
      avatarUrl: AVATAR_AARAV,
      initials: "AM",
      verified: true,
    },
    meta: "Tower B • B-904 • 2h ago",
    isPublic: true,
    image: HERO_CRICKET,
    title: "Weekend Cricket Match 🏏",
    category: "Sports",
    description:
      "Friendly match for all residents. Let's play, sweat and have fun together!",
    eventDate: "Sun, 3 Aug",
    eventTime: "7:00 AM",
    location: "Central Ground",
    joined: 0,
    capacity: 24,
    minParticipants: 24,
    isJoined: false,
    attendees: [
      { id: "a1", name: "Kanika", avatarUrl: AVATAR_NEHA },
      { id: "a2", name: "Neha", avatarUrl: AVATAR_AARAV },
      { id: "a3", name: "Rohan", avatarUrl: AVATAR_ROHAN },
      { id: "a4", name: "Priya" },
      { id: "a5", name: "Vikram" },
    ],
    likeCount: "21",
    isLiked: false,
    commentCount: 8,
    comments: [
      {
        id: "c1",
        author: "Neha Kapoor",
        avatarUrl: AVATAR_NEHA,
        text: "Count me in! Bringing the bats.",
        createdAt: "1h ago",
      },
      {
        id: "c2",
        author: "Rohan Sharma",
        avatarUrl: AVATAR_ROHAN,
        text: "What time should we reach the ground?",
        createdAt: "45m ago",
      },
    ],
  },
  {
    id: "dummy-post-1",
    kind: "post",
    createdAtMs: hoursAgo(4),
    author: {
      name: "Neha Kapoor",
      avatarUrl: AVATAR_NEHA,
      initials: "NK",
      verified: false,
    },
    meta: "A-110, Life Republic • 4h ago",
    isPublic: true,
    description:
      "Has anyone else noticed the beautiful sunset from the west wing today? 🌇 Completely mesmerized!",
    likeCount: "14",
    isLiked: false,
    commentCount: 2,
    comments: [
      {
        id: "c4",
        author: "Aarav Mehta",
        avatarUrl: AVATAR_AARAV,
        text: "Yes! Caught it from the terrace too.",
        createdAt: "3h ago",
      },
    ],
  },
  {
    id: "dummy-event-2",
    kind: "event",
    createdAtMs: hoursAgo(3),
    author: {
      name: "Rohan Sharma",
      avatarUrl: AVATAR_ROHAN,
      initials: "RS",
      verified: true,
    },
    meta: "Clubhouse • 3h ago",
    isPublic: true,
    title: "Monthly Society Meeting",
    description:
      "Join us for the monthly gathering to discuss upcoming festivals and society maintenance updates.",
    eventDate: "Fri, 15 Aug",
    eventTime: "6:00 PM",
    location: "Clubhouse Hall",
    isJoined: false,
    attendees: [],
    likeCount: "500000000000",
    isLiked: true,
    commentCount: 12,
    comments: [
      {
        id: "c3",
        author: "Managing Committee",
        text: "Agenda will be shared a day before.",
        createdAt: "2h ago",
      },
    ],
  },
  {
    id: "dummy-post-2",
    kind: "post",
    createdAtMs: minsAgo(30),
    author: {
      name: "Vikram Rao",
      avatarUrl: AVATAR_VIKRAM,
      initials: "VR",
      verified: true,
    },
    meta: "B-204, Life Republic • 30m ago",
    isPublic: true,
    image: PHOTO_GARDEN,
    description: "The community garden is blooming beautifully this week 🌿",
    likeCount: "1.5K",
    isLiked: true,
    commentCount: 1,
    comments: [
      {
        id: "c7",
        author: "Priya",
        text: "Looks lovely! Who's been watering it?",
        createdAt: "15m ago",
      },
    ],
  },
  {
    id: "dummy-poll-1",
    kind: "poll",
    createdAtMs: hoursAgo(5),
    author: {
      // No avatarUrl on purpose — exercises the initials fallback.
      name: "Managing Committee",
      initials: "MC",
      verified: false,
    },
    meta: "Official • 5h ago",
    isPublic: true,
    title: "Which facility should we upgrade next?",
    options: [
      { id: "dummy-poll-1-o1", name: "Gym Equipment", votes: 77 },
      { id: "dummy-poll-1-o2", name: "Swimming Pool Temp", votes: 32 },
      { id: "dummy-poll-1-o3", name: "Tennis Court Lights", votes: 19 },
    ],
    totalVotes: 128,
    pollEndsLabel: "Poll ends in 2 days",
    votedOptionId: "dummy-poll-1-o2",
    likeCount: "32M",
    isLiked: false,
    commentCount: 15,
    comments: [
      {
        id: "c5",
        author: "Rohan Sharma",
        avatarUrl: AVATAR_ROHAN,
        text: "Gym equipment is long overdue.",
        createdAt: "4h ago",
      },
    ],
  },
];

// ── In-memory dummy state + actions ─────────────────────────────────────────
// Deliberately a standalone store: production stores stay free of dummy logic,
// and nothing is written to AsyncStorage.

type DummyState = {
  items: HomeFeedItem[];
  toggleLike: (id: string) => void;
  vote: (id: string, optionId: string) => void;
  toggleRsvp: (id: string) => void;
  addComment: (id: string, text: string) => Promise<void>;
  reset: () => void;
};

const clone = () => HOME_DUMMY_FEED.map((i) => ({ ...i }));

const update = (
  items: HomeFeedItem[],
  id: string,
  fn: (item: HomeFeedItem) => HomeFeedItem,
) => items.map((i) => (i.id === id ? fn(i) : i));

export const useHomeDummyStore = create<DummyState>((set) => ({
  items: clone(),

  toggleLike: (id) =>
    set((s) => ({
      items: update(s.items, id, (i) => ({
        ...i,
        isLiked: !i.isLiked,
        likeCount: i.likeCount + (i.isLiked ? -1 : 1),
      })),
    })),

  vote: (id, optionId) =>
    set((s) => ({
      items: update(s.items, id, (i) => {
        if (i.votedOptionId) return i; // one vote per user, same as the API
        return {
          ...i,
          votedOptionId: optionId,
          totalVotes: (i.totalVotes ?? 0) + 1,
          options: (i.options ?? []).map((o) =>
            o.id === optionId ? { ...o, votes: o.votes + 1 } : o,
          ),
        };
      }),
    })),

  toggleRsvp: (id) =>
    set((s) => ({
      items: update(s.items, id, (i) => ({
        ...i,
        isJoined: !i.isJoined,
        joined: (i.joined ?? 0) + (i.isJoined ? -1 : 1),
      })),
    })),

  addComment: async (id, text) => {
    set((s) => ({
      items: update(s.items, id, (i) => ({
        ...i,
        commentCount: i.commentCount + 1,
        comments: [
          ...(i.comments ?? []),
          { id: `local-${i.comments?.length ?? 0}`, author: "You", text, createdAt: "just now" },
        ],
      })),
    }));
  },

  reset: () => set({ items: clone() }),
}));
