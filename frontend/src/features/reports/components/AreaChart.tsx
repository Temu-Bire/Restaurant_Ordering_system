interface AreaChartProps {
  labels: string[];
  values: number[];
}

export default function AreaChart({ labels, values }: AreaChartProps) {
  if (values.length === 0) return null;

  const max = Math.max(...values, 1);
  const step = values.length > 1 ? 100 / (values.length - 1) : 0;

  const line = values
    .map((v, i) => `${i * step},${38 - (v / max) * 34}`)
    .join(" ");
  const area = `0,40 ${line} ${(values.length - 1) * step},40`;

  const description = labels.map((l, i) => `${l}: ${values[i]}`).join(", ");

  return (
    <div>
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Sales chart. ${description}`}
        className="h-48 w-full"
      >
        <polygon points={area} className="fill-primary/20" />
        <polyline
          points={line}
          className="fill-none stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-2 flex justify-between text-xs text-muted">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}