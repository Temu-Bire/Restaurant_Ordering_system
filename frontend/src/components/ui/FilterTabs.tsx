import { cn } from "../../lib/cn";

export interface FilterTab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterTabsProps<T extends string> {
  tabs: FilterTab<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
}: FilterTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors",
            tab.value === value
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface hover:bg-surface-secondary"
          )}
        >
          {tab.label}
          {tab.count !== undefined && ` (${tab.count})`}
        </button>
      ))}
    </div>
  );
}