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
  readOnly?: boolean;
  onClose: () => void;
  onSave?: (id: string, status: OrderStatus) => void;
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

const WORKFLOW_NEXT: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  pending: { next: "confirmed", label: "Confirm Order →" },
  confirmed: { next: "preparing", label: "Start Preparing →" },
  preparing: { next: "ready", label: "Mark as Ready →" },
  ready: { next: "completed", label: "Complete Order ✓" },
};

export default function OrderDetailsModal({
  order,
  readOnly = false,
  onClose,
  onSave,
}: OrderDetailsModalProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [saving, setSaving] = useState(false);

  const itemCount = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  const dateFormatted = new Date(order.date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const nextStep = WORKFLOW_NEXT[order.status];

  async function handleQuickAdvance(targetStatus: OrderStatus) {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(order.id, targetStatus);
      setStatus(targetStatus);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveStatus() {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(order.id, status);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={readOnly ? "Order Details (Read-Only)" : "Order Details"}>
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <p className="text-2xl font-black text-foreground">#{order.id}</p>
          <Badge variant={order.status} className="capitalize text-xs">
            {order.status}
          </Badge>
        </div>
        <span className="text-xs text-muted">{formatTimeAgo(order.date)}</span>
      </div>

      {/* Customer and Order metadata */}
      <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface-secondary/40 p-3 text-xs">
        <div>
          <span className="font-semibold text-muted block">Customer</span>
          <span className="font-bold text-foreground text-sm">
            {order.customerName || "Customer"}
          </span>
          {order.customerPhone && (
            <span className="text-muted block">{order.customerPhone}</span>
          )}
        </div>
        <div>
          <span className="font-semibold text-muted block">Order Type & Table</span>
          <span className="font-bold text-foreground text-sm">
            {ORDER_TYPE_LABEL[order.type]}
            {order.table ? ` · Table ${order.table}` : ""}
          </span>
          <span className="text-muted block">{dateFormatted}</span>
        </div>
      </div>

      {/* Ordered Items */}
      <div className="mt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
          Ordered Items ({itemCount})
        </h4>
        <ul className="divide-y divide-border max-h-56 overflow-y-auto pr-1">
          {order.lines.map((line, idx) => {
            const gradient = getGradient(line.name);
            return (
              <li key={`${line.name}-${idx}`} className="flex items-center gap-3 py-2.5">
                <div className={cn("size-8 shrink-0 rounded-lg bg-gradient-to-br", gradient)} />
                <span className="flex-1 text-[13px] font-bold text-foreground truncate">
                  {line.name}
                </span>
                <span className="text-[13px] text-muted">×{line.quantity}</span>
                <span className="w-20 text-right text-[13px] font-bold text-foreground">
                  {formatCurrency(line.price * line.quantity)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-bold">
        <span className="text-foreground">Total Order Amount</span>
        <span className="text-lg font-black text-primary">
          {formatCurrency(order.total)}
        </span>
      </div>

      {/* Staff Actions vs Read-Only Admin Controls */}
      {readOnly ? (
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-muted">
            ℹ️ Read-only view. Order processing is restricted to Staff.
          </span>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3 border-t border-border pt-4">
          {/* Quick Workflow Advance button */}
          {nextStep && (
            <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 p-3">
              <div>
                <span className="text-xs font-semibold text-primary block">
                  Next Workflow Stage:
                </span>
                <span className="text-sm font-bold text-foreground capitalize">
                  {nextStep.next}
                </span>
              </div>
              <Button
                size="sm"
                disabled={saving}
                onClick={() => handleQuickAdvance(nextStep.next)}
              >
                {nextStep.label}
              </Button>
            </div>
          )}

          {/* Status selector & actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="w-48">
              <Select
                label="Manual Status Change"
                value={status}
                options={statusOptions}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
              />
            </div>

            <div className="flex items-center gap-2">
              {order.status !== "cancelled" && order.status !== "completed" && (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={saving}
                  onClick={() => handleQuickAdvance("cancelled")}
                >
                  Cancel Order
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button size="sm" disabled={saving || status === order.status} onClick={handleSaveStatus}>
                Save Status
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
