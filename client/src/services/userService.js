import api from "./api";

const userService = {

  // ── Notifications ──────────────────────────────────────────────────────────
  getMyNotifications:      (params = {}) => api.get("/users/notifications", { params }),
  markNotificationRead:    (id)          => api.patch(`/users/notifications/${id}/read`),
  markAllNotificationsRead: ()           => api.patch("/users/notifications/mark-all"),
  deleteNotification:        (id)          => api.delete(`/users/notifications/${id}`),
  deleteMultipleNotifications: (data)      => api.post("/users/notifications/delete-multiple", data),

      // ── Saved Books ──────────────────────────────────────────────────────────
  getSavedBooks: () => api.get("/users/saved-books"),
  saveBook:      (bookId) => api.post("/users/saved-books", { bookId }),
  unsaveBook:    (bookId) => api.delete(`/users/saved-books/${bookId}`),
};

export default userService;