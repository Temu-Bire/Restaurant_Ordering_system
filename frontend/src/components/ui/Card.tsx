import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function Card({
  title,
  description,
  action,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-surface p-5",
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-bold">{title}</h2>}
            {description && (
              <p className="mt-1 text-[13px] text-muted">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {children}
    </section>
  );
}