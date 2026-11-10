import { cn } from "../../../lib/cn";
import type { OrderStatus } from "../types";

const STEPS = ["Placed", "Confirmed", "Preparing", "Ready", "Delivered"];

const STATUS_STEP: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  completed: 4,
  cancelled: -1,
};

export default function OrderStatusStepper({ status }: { status: OrderStatus }) {
  const current = STATUS_STEP[status];

  return (
    <ol className="flex justify-between">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;

        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs",
                done || active
                  ? "bg-primary text-white"
                  : "bg-surface-secondary text-muted"
              )}
            >
              {done ? "✓" : active ? "●" : ""}
            </span>
            <span
              className={cn(
                "text-xs",
                active ? "font-bold" : "text-muted"
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