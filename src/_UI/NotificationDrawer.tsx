import React from "react";
import { useRouter } from "next/router";
import { Bell, Package, CreditCard, XCircle, AlertTriangle, CheckCircle, X } from "lucide-react";
import { useAppSelector } from "@/_redux/store";
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

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  loading?: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  ORDER_PLACED: <Package className="w-4 h-4" />,
  ORDER_CONFIRMED: <CheckCircle className="w-4 h-4" />,
  ORDER_SHIPPED: <Package className="w-4 h-4" />,
  ORDER_DELIVERED: <CheckCircle className="w-4 h-4" />,
  ORDER_CANCELLED: <XCircle className="w-4 h-4" />,
  ORDER_FAILED: <AlertTriangle className="w-4 h-4" />,
  PAYMENT_SUCCESS: <CreditCard className="w-4 h-4" />,
  PAYMENT_FAILED: <XCircle className="w-4 h-4" />,
  LOW_STOCK: <AlertTriangle className="w-4 h-4" />,
  SYSTEM: <Bell className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  ORDER_PLACED: "var(--color-primary)",
  ORDER_CONFIRMED: "var(--color-primary)",
  PAYMENT_SUCCESS: "#10b981",
  ORDER_DELIVERED: "#10b981",
  ORDER_CANCELLED: "#ef4444",
  ORDER_FAILED: "#ef4444",
  PAYMENT_FAILED: "#ef4444",
  LOW_STOCK: "#f59e0b",
  SYSTEM: "var(--text-secondary)",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  loading,
}) => {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = appConstants.ADMIN_ROLES.includes(
    (user?.profileType?.toUpperCase() ?? "") as any
  );

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    const orderReference = notification.metadata?.orderReference;
    if (orderReference) {
      onClose();
      router.push(isAdmin ? `/admin/order/${orderReference}` : `/my-orders/${orderReference}`);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[998] bg-black/30 transition-opacity"
          style={{ opacity: isOpen ? 1 : 0 }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 z-[999] h-full w-full max-w-sm transition-transform duration-300 ease-out"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          background: "var(--surface-paper)",
          borderLeft: "1px solid var(--border-light)",
          boxShadow: isOpen ? "var(--shadow-lg, -10px 0 30px rgba(0,0,0,0.1))" : "none",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-light)" }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span
                className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: "var(--color-primary, #16a34a)" }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs font-medium cursor-pointer transition-colors"
                style={{ color: "var(--color-primary, #16a34a)" }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg cursor-pointer transition-colors"
              style={{ color: "var(--text-hint)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-low, #f3f4f6)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto" style={{ height: "calc(100% - 57px)" }}>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full" style={{ background: "var(--surface-medium)" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded" style={{ background: "var(--surface-medium)", width: "60%" }} />
                    <div className="h-2.5 rounded" style={{ background: "var(--surface-medium)", width: "90%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-5">
              <Bell className="w-12 h-12 mb-3" style={{ color: "var(--text-disabled)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                No notifications
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className="w-full flex gap-3 px-5 py-3.5 text-left transition-colors cursor-pointer"
                style={{
                  borderBottom: "1px solid var(--border-light, rgba(255,255,255,0.08))",
                  background: n.isRead ? "transparent" : "rgba(22,163,74,0.05)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-low, rgba(255,255,255,0.04))"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = n.isRead ? "transparent" : "rgba(22,163,74,0.05)"; }}
              >
                {/* Icon */}
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: `${TYPE_COLORS[n.type] || "var(--text-hint, #9ca3af)"}15`,
                    color: TYPE_COLORS[n.type] || "var(--text-hint, #9ca3af)",
                  }}
                >
                  {TYPE_ICONS[n.type] || <Bell className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm truncate"
                      style={{
                        color: "var(--text-primary)",
                        fontWeight: n.isRead ? 400 : 600,
                      }}
                    >
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span
                        className="flex-shrink-0 w-2 h-2 rounded-full"
                        style={{ background: "var(--color-primary, #16a34a)" }}
                      />
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5 line-clamp-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {n.message}
                  </p>
                  <p className="text-[0.65rem] mt-1" style={{ color: "var(--text-hint)" }}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationDrawer;
