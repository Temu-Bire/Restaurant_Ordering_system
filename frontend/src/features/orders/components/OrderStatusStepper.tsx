import { cn } from "../../../lib/cn";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import type { OrderStatus } from "../types";

const STATUS_STEP: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  completed: 4,
  cancelled: -1,
};

export default function OrderStatusStepper({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const current = STATUS_STEP[status];

  const steps = [
    t("statusPending"),
    t("statusConfirmed"),
    t("statusPreparing"),
    t("statusReady"),
    t("statusCompleted"),
  ];

  return (
    <ol className="flex min-w-[280px] justify-between">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;

        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5 px-1">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                done || active
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-secondary text-muted"
              )}
            >
              {done ? "✓" : active ? "●" : i + 1}
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
