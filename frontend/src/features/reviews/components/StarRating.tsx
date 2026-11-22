import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "../../../lib/cn";

interface StarRatingProps {
  value: number; // 0 to 5
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (val: number) => void;
  showScore?: boolean;
  count?: number;
  className?: string;
}

const sizeClasses = {
  sm: "size-3.5",
  md: "size-4.5",
  lg: "size-6",
};

export default function StarRating({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  showScore = false,
  count,
  className = "",
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={interactive ? () => setHoverValue(null) : undefined}
      >
        {Array.from({ length: max }).map((_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= Math.round(displayValue);

          return (
            <button
              key={starNumber}
              type="button"
              disabled={!interactive}
              onClick={interactive && onChange ? () => onChange(starNumber) : undefined}
              onMouseEnter={interactive ? () => setHoverValue(starNumber) : undefined}
              className={cn(
                "p-0.5 transition-transform",
                interactive ? "cursor-pointer hover:scale-115 focus:outline-hidden" : "cursor-default"
              )}
              aria-label={interactive ? `Rate ${starNumber} stars` : `${value} stars`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-muted/40"
                )}
              />
            </button>
          );
        })}
      </div>

      {showScore && (
        <span className="text-xs font-bold text-foreground">
          {value > 0 ? value.toFixed(1) : "New"}
        </span>
      )}

      {count !== undefined && (
        <span className="text-xs text-muted">
          ({count})
        </span>
      )}
    </div>
  );
}
