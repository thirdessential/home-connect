// Maps a notification's backend data (entityType/entityId, or an explicit
// `path`) to an app route. Falls back to the Notifications page.
export function notificationRoute(data?: Record<string, any>): any {
  if (!data) return "/(shared)/notifications";
  if (typeof data.path === "string") return data.path;
  const id = data.entityId != null ? String(data.entityId) : undefined;
  switch (data.entityType) {
    case "event":
      return id ? { pathname: "/(shared)/event-details", params: { eventId: id } } : "/(shared)/notifications";
    case "admin_request":
      return id ? { pathname: "/profile/admin-request-details", params: { type: data.requestType === "business" ? "business" : "resident", id } } : "/(shared)/notifications";
    case "report":
      // Reporter gets status updates; admins get new-report alerts.
      return data.type === "REPORT_CREATED" ? "/profile/society-reports" : "/profile/my-reports";
    case "post":
    case "poll":
      return "/(tabs)/home";
    default:
      return "/(shared)/notifications";
  }
}
