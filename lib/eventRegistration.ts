// Presentation of the backend's `registrationStatus` (see home-connect-server
// event.service.js getEventRegistrationStatus). The server decides; the app only
// maps the status to a label — no capacity/time rules live here.

export type RegistrationStatus = "OPEN" | "FULL" | "CLOSED" | "STARTED" | "JOINED" | "CANCELLED";

export type RegistrationUi = { label: string; disabled: boolean; icon: "arrow-forward" | "checkmark-circle" | "lock-closed-outline" };

export const registrationUi = (status?: string | null, fallbackLabel = "Join Event"): RegistrationUi => {
  switch (status) {
    case "JOINED":
      return { label: "Joined", disabled: false, icon: "checkmark-circle" };
    case "FULL":
      return { label: "SOLD OUT", disabled: true, icon: "lock-closed-outline" };
    case "CLOSED":
      return { label: "REGISTRATION CLOSED", disabled: true, icon: "lock-closed-outline" };
    case "STARTED":
      return { label: "EVENT STARTED", disabled: true, icon: "lock-closed-outline" };
    case "CANCELLED":
      return { label: "EVENT CANCELLED", disabled: true, icon: "lock-closed-outline" };
    default:
      return { label: fallbackLabel, disabled: false, icon: "arrow-forward" };
  }
};

/** True when a failed join means the event filled up (server `errorCode`). */
export const isEventFullError = (e: any) => e?.body?.errorCode === "EVENT_FULL";
