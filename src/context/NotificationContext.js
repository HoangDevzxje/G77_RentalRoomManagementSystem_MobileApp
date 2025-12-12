import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  getMyNotifications,
  markNotificationsAsRead,
} from "../api/notificationsApi";
import { socketService } from "../services/socketService";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext({});

const toId = (id) => {
  if (!id) return "";
  if (typeof id === "object" && id._id) return id._id.toString();
  if (id.toString) return id.toString();
  return String(id);
};

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const localReadIds = useRef(new Set());
  const notificationsRef = useRef(notifications);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    if (token) {
      socketService.connect(token);

      socketService.on("new_notification", (newNoti) => {
        setNotifications((prev) => [newNoti, ...prev]);
      });
      socketService.on("notification_updated", (payload) => {
        setNotifications((prev) =>
          prev.map((n) =>
            toId(n._id) === toId(payload.id) ? { ...n, ...payload } : n
          )
        );
      });
    }

    return () => {
      socketService.off("new_notification");
      socketService.off("notification_updated");
    };
  }, [token, user]);

  const fetchNotifications = useCallback(
    async ({ page = 1, limit = 20, replace = true } = {}) => {
      try {
        const res = await getMyNotifications({ page, limit });
        const list = res.data || [];
        const currentUserId = toId(user?._id || user?.id);

        const formattedList = list.map((n) => {
          const notiId = toId(n._id || n.id);
          const isServerRead = n.readBy?.some(
            (rb) => toId(rb.accountId) === currentUserId
          );
          const isLocalRead = localReadIds.current.has(notiId);
          // Backend trả về isRead hoặc tự tính toán
          const isBackendFlag = !!n.isRead;

          return {
            ...n,
            _id: notiId,
            isRead: isServerRead || isLocalRead || isBackendFlag,
          };
        });

        if (replace) setNotifications(formattedList);
        else setNotifications((prev) => [...prev, ...formattedList]);

        return res;
      } catch (err) {
        console.error(err);
      }
    },
    [user]
  );

  // Xóa hàm fetchUnreadCount ở đây

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;
    const sId = toId(notificationId);

    localReadIds.current.add(sId);

    // Cập nhật state notifications, unreadCount sẽ tự giảm
    setNotifications((prev) =>
      prev.map((n) => {
        if (toId(n._id) === sId && !n.isRead) {
          return { ...n, isRead: true };
        }
        return n;
      })
    );

    try {
      await markNotificationsAsRead([sId]);
    } catch (err) {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((n) => !n.isRead)
      .map((n) => toId(n._id || n.id));

    if (unreadIds.length === 0) return;

    unreadIds.forEach((id) => localReadIds.current.add(id));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await markNotificationsAsRead(unreadIds);
    } catch (err) {
      fetchNotifications({ replace: true });
    }
  }, [notifications, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
