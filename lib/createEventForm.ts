// Pure logic behind the Create Event screen (app/(shared)/create-event.tsx): default schedule,
// per-field validation, participant limits and the API payload. No React / React Native imports so it
// runs under `npm test`. Field limits mirror home-connect-server (EVENT_LIMITS and createEvent in
// src/controllers/event.controller.js); the backend stays the source of truth for those.

import type { CreateEventPayload, ParticipationType } from "@/types/event.type";

export const EVENT_FORM_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 70,
  DESCRIPTION_MIN: 5,
  DESCRIPTION_MAX: 300,
  RULES_MAX: 250,
  IMAGES_MAX: 5,
  /** Backend rejects a start sooner than this. */
  MIN_START_LEAD_HOURS: 2,
} as const;

/** Allowed participant range (enforced in the app) and the default Maximum Participants. */
export const MIN_EVENT_PARTICIPANTS = 2;
export const MAX_EVENT_PARTICIPANTS = 20;
export const DEFAULT_MAX_PARTICIPANTS = 5;

/** "Registration closes at event start" — the existing option, sent as `registrationclosesbefore: 0`. */
export const DEFAULT_CLOSES_HOURS = "0";

/** New events start 2h30 from now, rounded up to the next 5 minutes. */
export const DEFAULT_START_LEAD_MINUTES = 150;
export const START_TIME_STEP_MINUTES = 5;

/** End dropdown options (the original ones): the end date is N days after the start date, the end time N hours after the start time. */
export const END_DAY_OPTIONS = [1, 2, 3, 7, 14] as const;
export const END_HOUR_OPTIONS = [1, 2, 3, 6, 12] as const;
export const DEFAULT_END_DAYS_AFTER = 1;
export const DEFAULT_END_HOURS_AFTER = 1;

// ---- Date/time helpers (device-local, same convention as the rest of the screen) ----------------

/** `date` is "YYYY-MM-DD", `time` is 24-hour "HH:MM" — the exact formats the API expects. */
export type DateTimeParts = { date: string; time: string };

const pad2 = (n: number) => String(n).padStart(2, "0");

export const toLocalParts = (d: Date): DateTimeParts => ({
  date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
  time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
});

/** Local Date for a date/time pair, or null when either part is missing or malformed. */
export const partsToDate = (date: string, time: string): Date | null => {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec((date || "").slice(0, 10));
  const tm = /^(\d{1,2}):(\d{2})$/.exec((time || "").trim());
  if (!dm || !tm) return null;
  const d = new Date(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(tm[1]), Number(tm[2]));
  return Number.isNaN(d.getTime()) ? null : d;
};

// Wall-clock milliseconds (fields read as UTC). The backend stores date + time as plain wall-clock
// values, so start/end arithmetic and comparisons must not depend on the device's DST rules.
const wallMs = (date: string, time: string): number | null => {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec((date || "").slice(0, 10));
  const tm = /^(\d{1,2}):(\d{2})$/.exec((time || "").trim());
  return dm && tm ? Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(tm[1]), Number(tm[2])) : null;
};

const addMinutes = (parts: DateTimeParts, minutes: number): DateTimeParts | null => {
  const base = wallMs(parts.date, parts.time);
  if (base === null) return null;
  const d = new Date(base + minutes * 60_000);
  return {
    date: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
    time: `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`,
  };
};

/** now + 2h30, rounded UP to the next 5-minute mark; crossing midnight rolls the date forward. */
export const defaultStartParts = (now: Date = new Date()): DateTimeParts => {
  const d = new Date(now.getTime() + DEFAULT_START_LEAD_MINUTES * 60_000);
  if (d.getSeconds() || d.getMilliseconds()) {
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);
  }
  const rem = d.getMinutes() % START_TIME_STEP_MINUTES;
  if (rem) d.setMinutes(d.getMinutes() + START_TIME_STEP_MINUTES - rem);
  return toLocalParts(d);
};

/**
 * End = start date + `daysAfter` calendar days, and start time + `hoursAfter` hours (time of day,
 * wrapping past midnight). The two parts are independent, each driven by its own dropdown. Because the
 * end is derived from the start, it follows start changes while the chosen offsets are kept.
 */
export const computeEnd = (
  startDate: string,
  startTime: string,
  daysAfter: number = DEFAULT_END_DAYS_AFTER,
  hoursAfter: number = DEFAULT_END_HOURS_AFTER,
): { endDate: string; endTime: string } => ({
  endDate: addMinutes({ date: startDate, time: "00:00" }, daysAfter * 24 * 60)?.date ?? "",
  endTime: addMinutes({ date: startDate || "2000-01-01", time: startTime }, hoursAfter * 60)?.time ?? "",
});

export const defaultSchedule = (now: Date = new Date()) => {
  const start = defaultStartParts(now);
  return { startDate: start.date, startTime: start.time, ...computeEnd(start.date, start.time) };
};

// ---- Form values --------------------------------------------------------------------------------

export type EventFormValues = {
  title: string;
  eventType: string | null;
  description: string;
  images: string[];
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  venue: string;
  participationType: ParticipationType;
  feeAmount: string;
  minParticipants: number;
  maxParticipants: number;
  closesHours: string;
  rules: string;
  agree: boolean;
};

/** Values a brand-new event form opens with. Only ever used as the initial state, never re-applied. */
export const initialEventFormValues = (now: Date = new Date()): EventFormValues => ({
  title: "",
  eventType: null,
  description: "",
  images: [],
  ...defaultSchedule(now),
  venue: "",
  participationType: "free",
  feeAmount: "",
  minParticipants: MIN_EVENT_PARTICIPANTS,
  maxParticipants: DEFAULT_MAX_PARTICIPANTS,
  closesHours: DEFAULT_CLOSES_HOURS,
  rules: "",
  agree: false,
});

// ---- Participant steppers -----------------------------------------------------------------------

// The Maximum field is typeable, so `max` can be NaN (emptied) or out of range while the user edits;
// the steppers must still land on a valid number.
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));

/** Min goes 2..max (never above the global cap). */
export const stepMinParticipants = (min: number, max: number, delta: number) =>
  clamp(min + delta, MIN_EVENT_PARTICIPANTS, Number.isFinite(max) ? Math.min(max, MAX_EVENT_PARTICIPANTS) : MAX_EVENT_PARTICIPANTS);

/** Max goes min..20. */
export const stepMaxParticipants = (max: number, min: number, delta: number) => {
  const floor = Math.max(min, MIN_EVENT_PARTICIPANTS);
  return clamp((Number.isFinite(max) ? max : floor) + delta, floor, MAX_EVENT_PARTICIPANTS);
};

// ---- Text area sizing ---------------------------------------------------------------------------

/** Box for a multiline input: `lines` tall to start, scrolling inside once it reaches ~2x that. */
export const textAreaHeights = (lines: number, lineHeight: number, verticalPadding: number) => {
  const minLines = Math.max(1, Math.floor(lines) || 1);
  const maxLines = Math.max(minLines * 2, minLines + 4);
  return {
    minHeight: minLines * lineHeight + verticalPadding * 2,
    maxHeight: maxLines * lineHeight + verticalPadding * 2,
  };
};

// ---- Validation ---------------------------------------------------------------------------------

export type EventFormField =
  | "title"
  | "eventType"
  | "description"
  | "images"
  | "startDate"
  | "startTime"
  | "endDate"
  | "endTime"
  | "venue"
  | "feeAmount"
  | "minParticipants"
  | "maxParticipants"
  | "closesHours"
  | "rules"
  | "agree";

export type FieldErrors = Partial<Record<EventFormField, string>>;

/** Fields in on-screen order per step — used to scroll to the first invalid one. */
export const STEP_FIELDS: Record<1 | 2 | 3 | 4, EventFormField[]> = {
  1: ["title", "eventType", "description", "images"],
  2: ["startDate", "startTime", "endDate", "endTime", "venue"],
  3: ["feeAmount", "minParticipants", "maxParticipants", "closesHours", "rules"],
  4: ["agree"],
};

const todayLocal = (now: Date) => toLocalParts(now).date;
const isInt = (n: number) => Number.isInteger(n);

const validateStep1 = (v: EventFormValues): FieldErrors => {
  const e: FieldErrors = {};
  const title = v.title.trim();
  if (!title) e.title = "Enter an event title";
  else if (title.length < EVENT_FORM_LIMITS.TITLE_MIN) e.title = `Title must be at least ${EVENT_FORM_LIMITS.TITLE_MIN} characters`;
  else if (title.length > EVENT_FORM_LIMITS.TITLE_MAX) e.title = `Title must be ${EVENT_FORM_LIMITS.TITLE_MAX} characters or fewer`;

  if (!v.eventType) e.eventType = "Select an event type";

  const description = v.description.trim();
  if (!description) e.description = "Add a short description";
  else if (description.length < EVENT_FORM_LIMITS.DESCRIPTION_MIN) e.description = `Description must be at least ${EVENT_FORM_LIMITS.DESCRIPTION_MIN} characters`;
  else if (description.length > EVENT_FORM_LIMITS.DESCRIPTION_MAX) e.description = `Description must be ${EVENT_FORM_LIMITS.DESCRIPTION_MAX} characters or fewer`;

  if (v.images.length > EVENT_FORM_LIMITS.IMAGES_MAX) e.images = `You can add at most ${EVENT_FORM_LIMITS.IMAGES_MAX} images`;
  return e;
};

const validateStep2 = (v: EventFormValues, now: Date): FieldErrors => {
  const e: FieldErrors = {};
  const start = partsToDate(v.startDate, v.startTime);

  if (!v.startDate) e.startDate = "Start date is required";
  if (!v.startTime) e.startTime = "Start time is required";
  if (start) {
    if (v.startDate.slice(0, 10) < todayLocal(now)) e.startDate = "Start date can't be in the past";
    else if (start.getTime() < now.getTime() + EVENT_FORM_LIMITS.MIN_START_LEAD_HOURS * 3600_000)
      e.startTime = `Event must start at least ${EVENT_FORM_LIMITS.MIN_START_LEAD_HOURS} hours from now`;
  }

  if (!v.endDate) e.endDate = "End date is required";
  if (!v.endTime) e.endTime = "End time is required";
  const startWall = wallMs(v.startDate, v.startTime);
  const endWall = wallMs(v.endDate, v.endTime);
  if (startWall !== null && endWall !== null) {
    if (v.endDate.slice(0, 10) < v.startDate.slice(0, 10)) e.endDate = "End date can't be before the start date";
    else if (endWall <= startWall) e.endTime = "End time must be after the start time";
  }

  if (!v.venue.trim()) e.venue = "Venue is required";
  return e;
};

const validateStep3 = (v: EventFormValues, now: Date): FieldErrors => {
  const e: FieldErrors = {};
  if (v.participationType === "paid" && (!v.feeAmount.trim() || !(Number(v.feeAmount) > 0))) {
    e.feeAmount = "Enter a valid participation fee";
  }

  const { minParticipants: min, maxParticipants: max } = v;
  const maxValid = isInt(max) && max >= MIN_EVENT_PARTICIPANTS && max <= MAX_EVENT_PARTICIPANTS;
  if (!isInt(max)) e.maxParticipants = "Enter a valid maximum number of participants";
  else if (!maxValid) e.maxParticipants = `Maximum participants must be between ${MIN_EVENT_PARTICIPANTS} and ${MAX_EVENT_PARTICIPANTS}`;

  if (!isInt(min) || min < MIN_EVENT_PARTICIPANTS) e.minParticipants = `Minimum participants must be at least ${MIN_EVENT_PARTICIPANTS}`;
  else if (min > MAX_EVENT_PARTICIPANTS) e.minParticipants = `Minimum participants can't be more than ${MAX_EVENT_PARTICIPANTS}`;
  else if (maxValid && min > max) {
    e.minParticipants = "Minimum can't exceed maximum participants";
    e.maxParticipants = "Maximum can't be less than minimum participants";
  }

  const closes = Number(v.closesHours);
  const start = partsToDate(v.startDate, v.startTime);
  if (!isInt(closes) || closes < 0) e.closesHours = "Select when registration closes";
  else if (start && start.getTime() - closes * 3600_000 <= now.getTime())
    e.closesHours = "Registration would already be closed — pick a shorter option or a later start";

  if (v.rules.trim().length > EVENT_FORM_LIMITS.RULES_MAX) e.rules = `Rules must be ${EVENT_FORM_LIMITS.RULES_MAX} characters or fewer`;
  return e;
};

/** Every invalid field of one step, all at once. Pure: never changes `values`. */
export const validateEventStep = (step: 1 | 2 | 3 | 4, values: EventFormValues, now: Date = new Date()): FieldErrors => {
  if (step === 1) return validateStep1(values);
  if (step === 2) return validateStep2(values, now);
  if (step === 3) return validateStep3(values, now);
  return values.agree ? {} : { agree: "Please confirm the details are correct" };
};

/** Steps 1-3 (plus the confirmation checkbox at publish time). */
export const validateEventForm = (
  values: EventFormValues,
  now: Date = new Date(),
  opts: { requireAgree?: boolean } = {},
): FieldErrors => ({
  ...validateStep1(values),
  ...validateStep2(values, now),
  ...validateStep3(values, now),
  ...(opts.requireAgree ? validateEventStep(4, values, now) : {}),
});

/** Which step a field lives on. */
export const stepOfField = (field: EventFormField): 1 | 2 | 3 | 4 =>
  ([1, 2, 3, 4] as const).find((s) => STEP_FIELDS[s].includes(field)) ?? 1;

/** First invalid field in on-screen order for a step, to scroll to. */
export const firstInvalidField = (step: 1 | 2 | 3 | 4, errors: FieldErrors): EventFormField | null =>
  STEP_FIELDS[step].find((f) => errors[f]) ?? null;

/**
 * What the UI paints red: fields flagged by a failed Next/Publish that are STILL invalid, with the
 * live message. A corrected field drops out immediately; a field that was never flagged stays clean.
 */
export const visibleFieldErrors = (flagged: readonly EventFormField[], live: FieldErrors): FieldErrors => {
  const out: FieldErrors = {};
  for (const f of flagged) if (live[f]) out[f] = live[f];
  return out;
};

// ---- API payload --------------------------------------------------------------------------------

/** Exactly the fields/format `createEvent()` in the backend reads. Line breaks inside the description are kept. */
export const buildCreateEventPayload = (v: EventFormValues): CreateEventPayload => ({
  eventtitle: v.title.trim(),
  eventtype: v.eventType as string,
  description: v.description.trim(),
  startdate: v.startDate,
  ...(v.startTime ? { starttime: v.startTime } : {}),
  ...(v.endDate ? { enddate: v.endDate } : {}),
  ...(v.endTime ? { endtime: v.endTime } : {}),
  venue: v.venue.trim(),
  participationtype: v.participationType,
  ...(v.participationType === "paid" ? { participationfeeamount: Number(v.feeAmount) } : {}),
  minimumparticipants: v.minParticipants,
  maximumparticipants: v.maxParticipants,
  registrationclosesbefore: Number(v.closesHours),
  ...(v.rules.trim() ? { rulesthingstobring: v.rules.trim() } : {}),
});
