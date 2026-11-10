import { formatCurrencyWhole } from "../../utils/formatCurrency";

interface BarChartProps {
  labels: string[];
  values: number[];
}

export default function BarChart({ labels, values }: BarChartProps) {
  const max = Math.max(...values, 1);
  const description = labels
    .map((l, i) => `${l}: ${formatCurrencyWhole(values[i])}`)
    .join(", ");

  return (
    <div
      role="img"
      aria-label={`Revenue chart. ${description}`}
      className="flex h-56 items-end gap-3"
    >
      {values.map((value, i) => (
        <div key={labels[i]} className="flex h-full flex-1 flex-col gap-2">
          <div className="relative flex-1">
            <div
              title={formatCurrencyWhole(value)}
              className="absolute inset-x-0 bottom-0 rounded-t-lg bg-primary"
              style={{ height: `${(value / max) * 100}%` }}
            />
          </div>
          <span className="text-center text-xs text-muted">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}