import { useState } from "react";

import Badge from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Modal from "../../../shared/components/ui/Modal";
import Select from "../../../shared/components/ui/Select";
import { cn } from "../../../lib/cn";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";
import {
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  PAYMENT_STATUS_LABEL,
  statusOptions,
  type Order,
  type OrderStatus,
} from "../types";
import { handoverOrder } from "../api/ordersApi";

interface OrderDetailsModalProps {
  order: Order;
  readOnly?: boolean;
  onClose: () => void;
  onSave?: (id: string, status: OrderStatus) => void;
  onOrderUpdated?: (updated: Order) => void;
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
  readOnly = false,
  onClose,
  onSave,
  onOrderUpdated,
}: OrderDetailsModalProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [saving, setSaving] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [handoverError, setHandoverError] = useState("");

  const itemCount = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  const dateFormatted = new Date(order.date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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

  async function handleHandover() {
    setSaving(true);
    setHandoverError("");
    try {
      const updated = await handoverOrder(order.id, handoverNotes);
      if (onOrderUpdated) {
        onOrderUpdated(updated);
      }
      if (onSave) {
        await onSave(order.id, updated.status);
      }
      setStatus(updated.status);
    } catch (err: unknown) {
      setHandoverError(err instanceof Error ? err.message : "Handover failed");
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

  // Determine handover button for Staff
  let handoverButton: { label: string; action: () => void; variant?: "primary" | "secondary" } | null = null;
  if (!readOnly) {
    if (order.type === "dine-in" && (order.status === "ready" || order.status === "preparing")) {
      handoverButton = {
        label: "🍽 Confirm Served to Table",
        action: () => handleHandover(),
      };
    } else if (order.type === "takeaway" && order.status === "ready") {
      handoverButton = {
        label: "🥡 Confirm Customer Pickup",
        action: () => handleHandover(),
      };
    } else if (order.type === "delivery") {
      if (order.status === "ready") {
        handoverButton = {
          label: "🛵 Handover to Courier (Out for Delivery)",
          action: () => handleHandover(),
        };
      } else if (order.status === "out_for_delivery") {
        handoverButton = {
          label: "✓ Confirm Final Handover (Delivered)",
          action: () => handleHandover(),
        };
      }
    }
  }

  return (
    <Modal open onClose={onClose} title={readOnly ? "Order Details (Read-Only)" : "Order Fulfillment & Status"}>
      <div className="space-y-4 max-h-[82vh] overflow-y-auto pr-1">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <p className="text-2xl font-black text-foreground">#{order.id}</p>
            <Badge variant={order.status} className="capitalize text-xs font-bold">
              {ORDER_STATUS_LABEL[order.status] ?? order.status}
            </Badge>
            <Badge
              variant={order.payment.paid ? "active" : "inactive"}
              className="text-xs font-bold"
            >
              Payment: {PAYMENT_STATUS_LABEL[order.payment.status ?? (order.payment.paid ? "paid" : "unpaid")]}
            </Badge>
          </div>
          <span className="text-xs text-muted">{formatTimeAgo(order.date)}</span>
        </div>

        {/* Customer and Order metadata */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface-secondary/40 p-3.5 text-xs">
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
            <span className="font-semibold text-muted block">Order Type & Fulfillment</span>
            <span className="font-bold text-foreground text-sm uppercase">
              {ORDER_TYPE_LABEL[order.type]}
            </span>
            <span className="text-muted block">{dateFormatted}</span>
          </div>

          {/* Type specific details */}
          {order.type === "dine-in" && (
            <div className="col-span-2 border-t border-border/60 pt-2 flex items-center justify-between">
              <div>
                <span className="text-muted">Table:</span>{" "}
                <span className="font-bold text-foreground">{order.table || "Unassigned"}</span>
                {order.tableCapacity && (
                  <span className="text-muted"> ({order.tableCapacity} seats)</span>
                )}
              </div>
              {order.partySize && (
                <div>
                  <span className="text-muted">Party Size:</span>{" "}
                  <span className="font-bold text-foreground">{order.partySize} Guests</span>
                </div>
              )}
            </div>
          )}

          {order.type === "takeaway" && order.pickupInstructions && (
            <div className="col-span-2 border-t border-border/60 pt-2">
              <span className="text-muted block">Pickup Instructions:</span>
              <span className="font-semibold text-foreground">{order.pickupInstructions}</span>
            </div>
          )}

          {order.type === "delivery" && (
            <div className="col-span-2 border-t border-border/60 pt-2 space-y-1">
              <div>
                <span className="text-muted block">Delivery Address:</span>
                <span className="font-semibold text-foreground">{order.deliveryAddress || "Address provided"}</span>
              </div>
              {order.deliveryDistanceKm && (
                <div className="text-[11px] text-muted">
                  Calculated Distance: <span className="font-bold">{order.deliveryDistanceKm} km</span>
                </div>
              )}
            </div>
          )}

          {/* Payment metadata */}
          <div className="col-span-2 border-t border-border/60 pt-2 flex items-center justify-between text-[11px]">
            <div>
              <span className="text-muted">Payment:</span>{" "}
              <span className="font-bold text-foreground">
                Mobile ({order.payment.provider ?? "Telebirr"})
              </span>
            </div>
            {order.payment.transactionId && (
              <div className="font-mono text-muted">
                Ref: {order.payment.transactionId}
              </div>
            )}
          </div>
        </div>

        {/* Handover Log if completed */}
        {order.handover && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
              <span>✓ Handover Completed</span>
              <span>{new Date(order.handover.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="text-foreground">
              Handed over by: <strong>{order.handover.staffName}</strong>
            </p>
            {order.handover.notes && (
              <p className="text-muted italic">Notes: "{order.handover.notes}"</p>
            )}
          </div>
        )}

        {/* Ordered Items */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
            Ordered Items ({itemCount})
          </h4>
          <ul className="divide-y divide-border max-h-48 overflow-y-auto pr-1">
            {order.lines.map((line, idx) => {
              const gradient = getGradient(line.name);
              return (
                <li key={`${line.name}-${idx}`} className="flex items-center gap-3 py-2.5">
                  <div className={cn("size-8 shrink-0 rounded-lg bg-gradient-to-br", gradient)} />
                  <span className="flex-1 text-[13px] font-bold text-foreground truncate">
                    {line.name}
                  </span>
                  <span className="text-[13px] text-muted">×{line.quantity}</span>
                  <span className="w-20 text-right text-[13px] font-bold text-foreground font-mono">
                    {formatCurrency(line.price * line.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Total breakdown */}
        <div className="border-t border-border pt-3 space-y-1 text-xs">
          {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
            <div className="flex justify-between text-muted">
              <span>Delivery Fee:</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm font-bold pt-1">
            <span className="text-foreground">Total Order Amount:</span>
            <span className="text-lg font-black text-primary">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {/* Staff Actions vs Read-Only Admin Controls */}
        {readOnly ? (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted">
              ℹ️ Read-only view. Order fulfillment is restricted to Staff.
            </span>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3 border-t border-border pt-3">
            {handoverError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs font-semibold text-rose-500">
                ⚠ {handoverError}
              </div>
            )}

            {/* Handover Action Card */}
            {handoverButton && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Fulfillment Handover</h5>
                    <p className="text-[11px] text-muted">Record staff handover timestamp and confirmation</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={handoverButton.action}
                    className="font-bold"
                  >
                    {handoverButton.label}
                  </Button>
                </div>

                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Optional handover notes (e.g. Courier plate # / handed to guest)"
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border bg-surface px-2.5 py-1.5 text-foreground placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Standard Kitchen Workflow Progression */}
            <div className="flex items-center gap-2 pt-1">
              {order.status === "pending" && (
                <Button size="sm" onClick={() => handleQuickAdvance("confirmed")} disabled={saving}>
                  Confirm Order →
                </Button>
              )}
              {order.status === "confirmed" && (
                <Button size="sm" onClick={() => handleQuickAdvance("preparing")} disabled={saving}>
                  Start Kitchen Preparing →
                </Button>
              )}
              {order.status === "preparing" && (
                <Button size="sm" onClick={() => handleQuickAdvance("ready")} disabled={saving}>
                  Mark as Ready →
                </Button>
              )}
              {order.status !== "completed" && order.status !== "cancelled" && (
                <Button size="sm" variant="outline" onClick={() => handleQuickAdvance("completed")} disabled={saving}>
                  Mark Completed
                </Button>
              )}
            </div>

            {/* Manual Status change & Cancel */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
              <div className="w-48">
                <Select
                  label="Override Status"
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
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
