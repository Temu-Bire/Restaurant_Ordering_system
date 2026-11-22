import type { ReactNode } from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "../../../lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-surface-secondary text-muted mb-3">
        {icon ?? <FolderOpen className="size-6" />}
      </div>
      {title && <h3 className="text-sm font-bold text-foreground">{title}</h3>}
      <p className="mt-1 text-xs text-muted max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
