import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightElement?: ReactNode;
}

export default function Input({
  label,
  error,
  id,
  className,
  rightElement,
  ...props
}: InputProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-foreground">
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full rounded-xl border border-border bg-surface-secondary px-3.5 py-2.5 text-foreground outline-none transition-colors",
            "placeholder:text-muted focus:border-orange-500 focus:ring-1 focus:ring-orange-500",
            rightElement && "pr-11",
            error && "border-danger focus:border-danger focus:ring-danger",
            className
          )}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 flex items-center justify-center text-muted">
            {rightElement}
          </div>
        )}
      </div>

      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
