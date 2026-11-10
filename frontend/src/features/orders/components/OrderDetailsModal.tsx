import { useState } from "react";

import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import { cn } from "../../../lib/cn";
import { menuItems } from "../../../mocks/menu";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatTimeAgo } from "../../../utils/formatTimeAgo";
import {
  ORDER_TYPE_LABEL,
  statusOptions,
  type Order,
  type OrderStatus,
} from "../types";

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onSave: (id: string, status: OrderStatus) => void;
}

export default function OrderDetailsModal({
  order,
  onClose,
  onSave,
}: OrderDetailsModalProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status);

  const itemCount = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtitle = [
    order.table && `Table ${order.table}`,
    `${itemCount} ${itemCount === 1 ? "item" : "items"}`,
    formatTimeAgo(order.date),
    ORDER_TYPE_LABEL[order.type],
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal open onClose={onClose} title="Order Details">
      <div className="flex items-center gap-3">
        <p className="text-2xl font-bold">#{order.id}</p>
        <Badge variant={order.status} className="capitalize">
          {order.status}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted">{subtitle}</p>

      <ul className="mt-4 divide-y divide-border">
        {order.lines.map((line) => {
          const gradient =
            menuItems.find((m) => m.name === line.name)?.gradient ??
            "from-orange-400 to-orange-600";

          return (
            <li key={line.name} className="flex items-center gap-3 py-3">
              <div className={cn("size-10 shrink-0 rounded-lg bg-gradient-to-br", gradient)} />
              <span className="flex-1 text-[13px] font-bold">{line.name}</span>
              <span className="text-[13px] text-muted">x{line.quantity}</span>
              <span className="w-16 text-right text-[13px] font-bold">
                {formatCurrency(line.price * line.quantity)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-between border-t border-border py-3 text-[13px] font-bold">
        <span>Total</span>
        <span>{formatCurrency(order.total)}</span>
      </div>

      <div className="mt-2 flex items-end gap-3">
        <div className="flex-1">
          <Select
            id="status"
            label="Update Status"
            value={status}
            options={statusOptions}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
          />
        </div>
        <Button
          onClick={() => {
            onSave(order.id, status);
            onClose();
          }}
        >
          Update Status
        </Button>
      </div>
    </Modal>
  );
}