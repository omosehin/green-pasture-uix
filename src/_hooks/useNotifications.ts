import { useState, useEffect, useCallback, useRef } from "react";
import { useAppSelector } from "@/_redux/store";
import { io, Socket } from "socket.io-client";
import { appConstants } from "@/_redux/constants";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export function useNotifications() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const axiosInstance = (await import("@/_utils/axiosInstance")).default;
      const res = await axiosInstance.get("notifications?limit=20");
      const data = res.data?.data;
      setNotifications(data?.notifications ?? []);
      setUnreadCount(data?.unreadCount ?? 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      const axiosInstance = (await import("@/_utils/axiosInstance")).default;
      await axiosInstance.patch(`notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const axiosInstance = (await import("@/_utils/axiosInstance")).default;
      await axiosInstance.patch("notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!isAuthenticated || !user?.id || !token) return;

    const baseUrl = appConstants.API_BASE_URL.replace("/api/v1/", "").replace("/api/v1", "");

    const socket = io(`${baseUrl}/notifications`, {
      auth: { token },
      query: { profileId: user.id },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
    });

    socket.on("new-notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
