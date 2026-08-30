// View-model the Home cards render. Both the real feed API and the isolated
// dummy layer map into this shape, so swapping the source never touches the UI.

export type HomeFeedKind = "event" | "post" | "poll";

export type HomeFeedAuthor = {
  name: string;
  avatarUrl?: string;
  /** Fallback shown when there is no profile photo. */
  initials: string;
  verified: boolean;
  /** True when identity is withheld (Guest viewer) — renders as a grey
   *  placeholder instead of the real avatar/initials. */
  isAnonymous?: boolean;
};

export type HomeFeedComment = {
  id: string;
  author: string;
  avatarUrl?: string;
  text: string;
  createdAt: string;
};

export type HomeFeedOption = { id: string; name: string; votes: number };

export type HomeFeedAttendee = { id: string; name: string; avatarUrl?: string };

export type HomeFeedItem = {
  id: string;
  kind: HomeFeedKind;
  /** MySQL events-table id. Real Join/RSVP and navigation to Event Details
   *  require this — a feed event without it predates the Event API migration. */
  mysqlEventId?: number | string | null;
  /** Raw sortable creation timestamp (ms). `meta`'s "2h ago" is display-only
   *  and can't be sorted on — the All tab orders on this instead. */
  createdAtMs: number;
  author: HomeFeedAuthor;
  /** "Tower B • B-904 • 2h ago" */
  meta: string;
  isPublic: boolean;
  /** false for Guest viewers — Like/Comment/Share must not render. Defaults true. */
  canInteract?: boolean;
  /** True when the authenticated user created this item — gates the Delete menu option. */
  isOwner?: boolean;

  image?: string;
  title?: string;
  category?: string;
  description?: string;

  // Event only
  eventDate?: string;
  eventTime?: string;
  location?: string;
  joined?: number;
  capacity?: number;
  minParticipants?: number;
  attendees?: HomeFeedAttendee[];
  isJoined?: boolean;

  // Poll only
  options?: HomeFeedOption[];
  totalVotes?: number;
  pollEndsLabel?: string;
  votedOptionId?: string | null;

  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  comments?: HomeFeedComment[];
};

/** Every interaction a Home card can trigger. */
export type HomeFeedActions = {
  toggleLike: (id: string) => void;
  vote: (id: string, optionId: string) => void;
  toggleRsvp: (id: string) => void;
  addComment: (id: string, text: string) => Promise<void>;
  /** Deletes an owned post/poll. Throws with a user-friendly message on failure. */
  deleteItem: (id: string) => Promise<void>;
};
