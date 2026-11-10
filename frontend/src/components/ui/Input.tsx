import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({
  label,
  error,
  id,
  className,
  ...props
}: InputProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>

      <input
        id={id}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full rounded-lg border border-border bg-surface-secondary px-3 py-2.5 text-foreground outline-none transition-colors",
          "placeholder:text-muted focus:border-primary",
          error && "border-danger",
          className
        )}
        {...props}
      />

      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}