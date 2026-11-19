import { useState } from "react";

import Badge from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Modal from "../../../shared/components/ui/Modal";
import Select from "../../../shared/components/ui/Select";
import { cn } from "../../../lib/cn";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";
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
          const gradient = getGradient(line.name);

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

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm font-bold">
        <span>Total</span>
        <span className="text-base text-primary">
          {formatCurrency(order.total)}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="w-44">
          <Select
            label="Update status"
            value={status}
            options={statusOptions}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onSave(order.id, status);
              onClose();
            }}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
