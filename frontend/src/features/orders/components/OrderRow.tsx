import Badge from "../../../shared/components/ui/Badge";
import { cn } from "../../../lib/cn";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
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
        "flex w-full items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3.5 text-left transition-all",
        onClick && "hover:bg-surface-secondary/70 hover:border-primary/30 cursor-pointer shadow-xs"
      )}
    >
      <div className={cn("size-10 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs shadow-xs", gradient)}>
        #{order.id.slice(-3)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">#{order.id}</p>
          <span className="text-xs font-semibold text-primary">· {order.customerName || "Customer"}</span>
        </div>
        <p className="text-xs text-muted truncate">
          {itemCount} {itemCount === 1 ? "item" : "items"} · {place} · {formatCurrency(order.total)}
        </p>
      </div>

      <Badge variant={order.status} className="capitalize text-xs font-bold">
        {order.status}
      </Badge>

      <span className="hidden w-24 text-right text-xs text-muted sm:block">
        {formatTimeAgo(order.date)}
      </span>
    </Tag>
  );
}
