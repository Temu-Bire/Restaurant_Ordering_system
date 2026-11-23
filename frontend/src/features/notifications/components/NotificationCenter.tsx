import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShoppingBag,
  CreditCard,
  User,
  X,
  CheckCheck,
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";
import { cn } from "../../../lib/cn";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } =
    useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ORDER_CONFIRMATION":
      case "PAYMENT_SUCCESS":
        return <CheckCircle2 className="size-4 text-emerald-500" />;
      case "PAYMENT_FAILURE":
      case "PAYMENT_ISSUE":
      case "ORDER_CANCELLED":
        return <AlertTriangle className="size-4 text-rose-500" />;
      case "NEW_ORDER":
        return <ShoppingBag className="size-4 text-amber-500" />;
      case "ORDER_STATUS_UPDATE":
        return <Clock className="size-4 text-sky-500" />;
      case "NEW_USER":
        return <User className="size-4 text-purple-500" />;
      default:
        return <CreditCard className="size-4 text-primary" />;
    }
  };

  const handleNotificationClick = (id: string, relatedEntityId?: string | null, isRead?: boolean) => {
    if (!isRead) {
      void markAsRead(id);
    }
    if (relatedEntityId) {
      navigate(`/customer/orders/${relatedEntityId}/track`);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground transition-colors hover:bg-surface-secondary"
      >
        <Bell className="size-4 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-surface shadow-2xl z-50 overflow-hidden animate-in fade-in-80 slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface-secondary/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <CheckCheck className="size-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted hover:text-foreground hover:bg-surface-secondary"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-border bg-surface px-4 py-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 font-semibold transition-colors",
                filter === "all"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground hover:bg-surface-secondary"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={cn(
                "rounded-lg px-2.5 py-1 font-semibold transition-colors",
                filter === "unread"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground hover:bg-surface-secondary"
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
            {loading && notifications.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted">
                <Bell className="size-8 stroke-[1.5] text-muted/50 mb-2" />
                <p className="text-xs font-medium">No notifications yet</p>
                <p className="text-[11px] text-muted/70 mt-0.5">
                  Updates on your orders and payments will appear here
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    handleNotificationClick(item.id, item.relatedEntityId, item.isRead)
                  }
                  className={cn(
                    "flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-surface-secondary/70",
                    !item.isRead ? "bg-primary/5" : "bg-surface"
                  )}
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface border border-border">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-xs truncate",
                          !item.isRead
                            ? "font-bold text-foreground"
                            : "font-semibold text-foreground/80"
                        )}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted line-clamp-2 mt-0.5">
                      {item.message}
                    </p>
                  </div>
                  {!item.isRead && (
                    <span className="size-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
