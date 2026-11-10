import { cn } from "../../lib/cn";

interface OptionPickerProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export default function OptionPicker<T extends string>({
  options,
  value,
  onChange,
}: OptionPickerProps<T>) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors",
            o.value === value
              ? "border-primary bg-primary/10"
              : "border-border bg-surface hover:bg-surface-secondary"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}