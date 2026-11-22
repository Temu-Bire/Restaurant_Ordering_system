import { Check, XCircle } from "lucide-react";
import { cn } from "../../../lib/cn";
import type { OrderStatus, OrderType } from "../types";

interface OrderStatusStepperProps {
  status: OrderStatus;
  type?: OrderType;
}

export default function OrderStatusStepper({ status, type = "dine-in" }: OrderStatusStepperProps) {
  let steps: string[] = [];
  let currentStepIndex = 0;

  if (type === "dine-in") {
    steps = ["Pending", "Confirmed", "Preparing", "Ready", "Served"];
    const map: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      ready: 3,
      served: 4,
      completed: 4,
      picked_up: 4,
      out_for_delivery: 4,
      delivered: 4,
      cancelled: -1,
    };
    currentStepIndex = map[status] ?? 0;
  } else if (type === "takeaway") {
    steps = ["Pending", "Confirmed", "Preparing", "Ready for Pickup", "Picked Up"];
    const map: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      ready: 3,
      picked_up: 4,
      completed: 4,
      served: 4,
      out_for_delivery: 4,
      delivered: 4,
      cancelled: -1,
    };
    currentStepIndex = map[status] ?? 0;
  } else {
    // Delivery
    steps = ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered"];
    const map: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      ready: 2,
      out_for_delivery: 3,
      delivered: 4,
      completed: 4,
      served: 4,
      picked_up: 4,
      cancelled: -1,
    };
    currentStepIndex = map[status] ?? 0;
  }

  if (status === "cancelled") {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs font-bold text-rose-500 flex items-center justify-center gap-2">
        <XCircle className="size-4 shrink-0" />
        <span>Order has been cancelled.</span>
      </div>
    );
  }

  return (
    <ol className="flex min-w-[320px] justify-between">
      {steps.map((label, i) => {
        const done = i < currentStepIndex;
        const active = i === currentStepIndex;

        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5 px-1">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                done
                  ? "bg-emerald-600 text-white shadow-xs"
                  : active
                  ? "bg-primary text-white shadow-xs ring-4 ring-primary/20"
                  : "bg-surface-secondary text-muted border border-border"
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-[11px] text-center line-clamp-1",
                active ? "font-bold text-foreground" : "text-muted"
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
