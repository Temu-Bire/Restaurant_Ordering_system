import Badge from "../../../shared/components/ui/Badge";
import { cn } from "../../../lib/cn";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";
import { ORDER_TYPE_LABEL, type Order } from "../types";

interface OrderRowProps {
  order: Order;
  onClick?: () => void;
}

const GRADIENTS = [
  "from-orange-400 to-orange-600",
  "from-amber-400 to-amber-600",
  "from-red-400 to-red-600",
  "from-yellow-400 to-orange-500",
];

function getGradient(name: string) {
  const code = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENTS[code % GRADIENTS.length];
}

export default function OrderRow({ order, onClick }: OrderRowProps) {
  const itemCount = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  const place = order.table ? `Table ${order.table}` : ORDER_TYPE_LABEL[order.type];
  const gradient = getGradient(order.lines[0]?.name ?? "Order");

  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 text-left",
        onClick && "transition-colors hover:bg-surface-secondary"
      )}
    >
      <div className={cn("size-10 shrink-0 rounded-lg bg-gradient-to-br", gradient)} />

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold">#{order.id}</p>
        <p className="text-xs text-muted">
          {itemCount} {itemCount === 1 ? "item" : "items"} · {place}
        </p>
      </div>

      <Badge variant={order.status} className="capitalize">
        {order.status}
      </Badge>

      <span className="hidden w-20 text-right text-xs text-muted sm:block">
        {formatTimeAgo(order.date)}
      </span>
    </Tag>
  );
}
