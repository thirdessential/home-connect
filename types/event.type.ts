// Matches home-connect-server src/controllers/event.controller.js exactly.

export type EventType = string; // backend accepts free-text event_type

export type ParticipationType = "free" | "paid";

export type EventRecord = {
  id: number;
  title: string;
  eventType: string;
  description: string;
  image: string | null;
  images?: string[];
  startDate: string;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  venue: string;
  participationType: ParticipationType;
  feeAmount: number | null;
  minParticipants: number;
  maxParticipants: number;
  registrationClosesBeforeHours: number;
  registrationClosesAt?: string | null;
  registrationDeadline: string | null;
  rulesToBring: string | null;
  status: string;
  registrationClosed?: boolean;
  joinedCount: number;
  /** Server-computed registration state (single source of truth). */
  maximumParticipants?: number;
  joinedParticipants?: number;
  remainingSlots?: number;
  registrationStatus?: "OPEN" | "FULL" | "CLOSED" | "STARTED" | "JOINED" | "CANCELLED" | "COMPLETED";
  canJoin?: boolean;
  cancelledCount: number;
  /** Capacity reached (server: joined >= max). `registrationStatus` still carries the more specific state. */
  housefull?: boolean;
  /** Viewer's own join request (server state); null/absent when none. */
  joinRequest?: { id: number; status: "pending" | "approved" | "rejected"; reason?: string | null; createdAt?: string } | null;
  /** Lifecycle fields — always sent by the server's serializeEvent (nullable ones are null until set). */
  reminderOffsets?: number[];
  delayMinutes?: number;
  completedAt?: string | null;
  registrationClosedAt?: string | null;
  cancelTitle?: string | null;
  cancelReason?: string | null;
  societyId: number | null;
  commentCount?: number;
  /** Present on the Joined Events list only. */
  organizer?: { name: string; profileImage: string | null };
  createdAt: string;
};

export type EventParticipant = {
  userId: string;
  name: string;
  profileImage: string | null;
  tower: string | null;
  unit: string | null;
  joinedAt: string;
  status: string;
};

export type EventOrganizer = {
  userId: string;
  name: string;
  profileImage: string | null;
  tower: string | null;
  unit: string | null;
};

export type EventDetail = EventRecord & {
  remainingToMinimum: number;
  remainingCapacity: number;
  organizer: EventOrganizer | null;
  currentUserJoined: boolean;
  joinedPreview: EventParticipant[];
};

export type EventComment = {
  id: number;
  text: string;
  user: { userId: string; name: string; profileImage: string | null };
  createdAt: string;
};

export type EventDashboard = {
  event: EventRecord & { visibility: "community" | "public" };
  statistics: {
    joinedParticipants: number;
    maximumParticipants: number;
    minimumParticipants: number;
    percentageFilled: number;
    feePerParticipant: number;
    expectedRevenue: number;
    registrationDeadline: string | null;
    eventStartAt: string | null;
    hasStarted?: boolean;
  };
  participants: EventParticipant[];
  cancelledCount: number;
};

// Create-event payload — field names exactly as read by createEvent().
export type CreateEventPayload = {
  eventtitle: string;
  eventtype: string;
  description: string;
  startdate: string;
  starttime?: string;
  enddate?: string;
  endtime?: string;
  venue: string;
  participationtype: ParticipationType;
  participationfeeamount?: number;
  minimumparticipants: number;
  maximumparticipants?: number;
  registrationclosesbefore: number;
  registrationclosesdate?: string;
  registrationclosestime?: string;
  rulesthingstobring?: string;
};

/** Event-specific report (POST /api/events/:id/reports). Statuses are the server's. */
export type EventReport = {
  id: number;
  eventId: number;
  eventTitle?: string;
  eventStatus?: string;
  title: string;
  description: string;
  status: "open" | "in_review" | "resolved" | "dismissed";
  reporter?: { userId: string; name: string; tower?: string | null; unit?: string | null };
  createdAt: string;
  updatedAt?: string;
};

/** Organizer view of a join request (GET /api/events/:id/join-requests). */
export type EventJoinRequest = {
  id: number;
  eventId: number;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  user?: { userId: string; name: string; profileImage?: string | null; tower?: string | null; unit?: string | null };
  createdAt: string;
  reviewedAt: string | null;
};
