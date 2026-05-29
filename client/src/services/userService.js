import api from "./api";

const userService = {
  // ── Notifications ──────────────────────────────────────────────────────────
  getMyNotifications:      (params = {}) => api.get("/users/notifications", { params }),
  markNotificationRead:    (id)          => api.patch(`/users/notifications/${id}/read`),
  markAllNotificationsRead: ()           => api.patch("/users/notifications/mark-all"),
};

export default userService;