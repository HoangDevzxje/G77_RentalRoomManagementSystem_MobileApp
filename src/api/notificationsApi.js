import baseApi from "./baseApi";

export const getMyNotifications = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const params = { page, limit };
    const res = await baseApi.get("/notifications/me", { params });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getNotificationById = async (id) => {
  try {
    const res = await baseApi.get(`/notifications/${id}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const markNotificationsAsRead = async (notificationIds = []) => {
  try {
    const res = await baseApi.post("/notifications/read", { notificationIds });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const res = await baseApi.get("/notifications/unread-count");
    return res.data;
  } catch (err) {
    throw err;
  }
};
