import Badge from "../../../components/ui/Badge";
import { cn } from "../../../lib/cn";
import { menuItems } from "../../../mocks/menu";
import { formatTimeAgo } from "../../../utils/formatTimeAgo";
import { ORDER_TYPE_LABEL, type Order } from "../types";

interface OrderRowProps {
  order: Order;
  onClick?: () => void;
}

export default function OrderRow({ order, onClick }: OrderRowProps) {
  const itemCount = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  const place = order.table ? `Table ${order.table}` : ORDER_TYPE_LABEL[order.type];
  const gradient =
    menuItems.find((m) => m.name === order.lines[0]?.name)?.gradient ??
    "from-orange-400 to-orange-600";

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