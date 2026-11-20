import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export type BadgeVariant =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "paid"
  | "unpaid"
  | "failed"
  | "expired"
  | "low"
  | "ok"
  | "active"
  | "inactive"
  | "disabled"
  | "customer"
  | "staff"
  | "admin"
  | "neutral";

const styles: Record<BadgeVariant, string> = {
  pending: "bg-pending/15 text-pending",
  confirmed: "bg-info/15 text-info",
  preparing: "bg-info/15 text-info",
  ready: "bg-success/15 text-success",
  served: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  picked_up: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  out_for_delivery: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  completed: "bg-muted/15 text-muted",
  cancelled: "bg-danger/15 text-danger",
  paid: "bg-success/15 text-success",
  unpaid: "bg-pending/15 text-pending",
  failed: "bg-danger/15 text-danger",
  expired: "bg-muted/15 text-muted",
  low: "bg-danger/15 text-danger",
  ok: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  inactive: "bg-danger/15 text-danger",
  disabled: "bg-danger/15 text-danger",
  neutral: "bg-muted/15 text-muted",
  customer: "bg-info/15 text-info",
  staff: "bg-pending/15 text-pending",
  admin: "bg-primary/15 text-primary",
};

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export default function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[variant] ?? styles.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
