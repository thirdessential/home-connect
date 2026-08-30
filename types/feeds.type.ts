import { verificationStatus } from "@/assets/enums/common.enum";
import { AddressVerificationType, User } from "@/store/auth.type";
import { BusinessCategory, ReportItem } from "./business.type";
import { Society } from "./society.type";

export interface FeedsState {
    feeds: FeedItem[];
    feedItem?: FeedItem;
    feedsByUser: FeedItem[];
    loading: boolean;
    error: string | null;
    lastFetchedAt: number | null;        // ← new
    cachedSocietyId: string | null;      // ← new
    isCacheValid: (societyId: string) => boolean;  // ← new
    fetchFeedsBySociety: (societyId: string, force?: boolean) => Promise<void>;
    getFeedsByUserId: (userId: string) => Promise<void>;
    setFeedsByUser: (feeds: FeedItem[]) => void;
    createFeed: (feed: Partial<FeedItem>) => Promise<void>;
    addFeedOptimistically: (feed: FeedItem) => void;
    updateFeed: (id: string, data: Partial<FeedItem>) => Promise<void>;
    removeFeed: (feedId: string) => Promise<boolean>;
    getFeedById: (feedId: string) => Promise<void>;
    toggleLike: (feedId: string, userId: string) => Promise<void>;
    addComment: (feedId: string, comment: any) => Promise<void>;
    addReply: (feedId: string, commentId: string, reply: any) => void;
    votePoll: (feedId: string, optionId: string, userId: string) => Promise<void>;
    addOrUpdateRSVP: (feedId: string, rsvpData: RsvpUser) => Promise<void>;
    removeRSVP: (feedId: string, userId: string) => Promise<void>;
    reportFeed: (feedId: string, userId: string, reason: string) => Promise<void>;
    addReview: (feedId: string, reviewData: { userId: string; rating: number; comment: string }) => Promise<void>;
    clear: () => void;
}

export type RsvpUser = {
    userId?: string;
    fullName?: string;
    phone?: string;
    profilePhotoUrl?: string;
    price?: number;
    participants?: number;
    status?: verificationStatus;
    updatedAt?: string;
    orderedAt?: string;
    verificationStatus?: AddressVerificationType
};

export type RsvpData = {
    rsvps: RsvpUser[];
};

export type FeedItem = {
    _id: string;
    type?: "post" | "poll" | "event";
    /**
     * Id of the row in the MySQL `events` table, set by the server when an event
     * is created through the Event API. Events are served exclusively by that API,
     * so a feed event without this id predates the migration and cannot be opened.
     */
    mysqlEventId?: number | string | null;
    /** Event category (backend's `event_type`, joined from the `events` table). */
    category?: string | null;
    title?: string;
    content?: string;
    user?: string | User;
    rsvps?: RsvpUser[];
    /** Real Event API participants (event_participants) — the authoritative
     *  join source for mysqlEventId events; `rsvps` above is feed_rsvps,
     *  which real joins never touch. Empty for posts/polls. */
    eventParticipants?: { userId: string; fullName?: string; profilePhotoUrl?: string }[];
    society?: string | Society;
    flatNo?: string;
    towerName?: string;
    description?: string;
    price?: string;
    eventDate?: string;
    eventTime?: string;
    maxParticipants?: string;
    minParticipants?: string;
    registeredParticipants?: number;
    location?: string;
    regDeadline?: string;
    eventDetails?: {
        freeChildren?: boolean;
        guests?: boolean;
        materials?: boolean;
        refreshments?: boolean;
    };
    report?: ReportItem[];
    totalReportCount?: number;
    reviews?: { userId?: string; rating?: number; comment?: string; createdAt?: string }[];
    options?: BusinessCategory[];
    totalVotes?: number;
    images?: string[];
    votes?: any[];
    likes?: any[];
    comments?: any[];
    createdAt?: string;
    updatedAt?: string;
};