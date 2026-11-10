import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export default function Select({
  label,
  options,
  id,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[13px] font-semibold">
          {label}
        </label>
      )}

      <select
        id={id}
        className={cn(
          "w-full rounded-lg border border-border bg-surface-secondary px-3 py-2.5 text-foreground outline-none transition-colors focus:border-primary",
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
    </div>
  );
}