import baseApi from "./baseApi";

export const getMyNotifications = async ({ page = 1, limit = 20 } = {}) => {
  const res = await baseApi.get("/notifications/me", {
    params: { page, limit },
  });
  return res.data;
};

export const getNotificationById = async (id) => {
  const res = await baseApi.get(`/notifications/${id}`);
  return res.data;
};

export const markNotificationsAsRead = async (notificationIds = []) => {
  const res = await baseApi.post("/notifications/read", { notificationIds });
  return res.data;
};

export const getUnreadNotificationCount = async () => {
  const res = await baseApi.get("/notifications/unread-count");
  return res.data;
};
