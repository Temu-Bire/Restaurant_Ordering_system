import type { SelectHTMLAttributes } from "react";
import { cn } from "../../../lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({
  label,
  error,
  options,
  id,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[13px] font-semibold text-foreground">
          {label}
        </label>
      )}

      <select
        id={id}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full rounded-xl border border-border bg-surface-secondary px-3.5 py-2.5 text-foreground outline-none transition-colors",
          "focus:border-orange-500 focus:ring-1 focus:ring-orange-500",
          error && "border-danger focus:border-danger focus:ring-danger",
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
