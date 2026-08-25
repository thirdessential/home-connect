// Matches home-connect-server src/controllers/event.controller.js exactly.

export type EventType = string; // backend accepts free-text event_type

export type ParticipationType = "free" | "paid";

export type EventRecord = {
  id: number;
  title: string;
  eventType: string;
  description: string;
  image: string | null;
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
  registrationDeadline: string | null;
  rulesToBring: string | null;
  status: string;
  joinedCount: number;
  cancelledCount: number;
  societyId: number | null;
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
  maximumparticipants: number;
  registrationclosesbefore: number;
  rulesthingstobring?: string;
};
