import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type BadgeVariant =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "paid"
  | "unpaid"
  | "low"
  | "ok"
  | "active"
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
  completed: "bg-muted/15 text-muted",
  cancelled: "bg-danger/15 text-danger",
  paid: "bg-success/15 text-success",
  unpaid: "bg-pending/15 text-pending",
  low: "bg-danger/15 text-danger",
  ok: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
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
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}