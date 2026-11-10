import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type Tone = "primary" | "success" | "info" | "purple";

const tones: Record<Tone, string> = {
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  info: "bg-info/15 text-info",
  purple: "bg-violet-500/15 text-violet-500",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: Tone;
  trend?: { value: string; positive: boolean };
}

export default function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  trend,
}: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl text-lg",
          tones[tone]
        )}
      >
        {icon}
      </div>

      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted">{label}</p>
        {trend && (
          <p
            className={cn(
              "mt-0.5 text-xs font-medium",
              trend.positive ? "text-success" : "text-danger"
            )}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}