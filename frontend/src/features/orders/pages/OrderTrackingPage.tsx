import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { UtensilsCrossed, ShoppingBag, Truck, Clock, CheckCircle2 } from "lucide-react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import OrderStatusStepper from "../components/OrderStatusStepper";
import {
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  PAYMENT_STATUS_LABEL,
  type Order,
  type OrderStatus,
} from "../types";
import { getOrder, cancelOrder } from "../api/ordersApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatCurrency } from "../../../shared/utils/formatCurrency";

const CANCELLABLE: OrderStatus[] = ["pending", "confirmed"];

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null | undefined>(id ? undefined : null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;

    function refresh() {
      getOrder(id!)
        .then((data) => {
          if (active) setOrder(data);
        })
        .catch(() => {
          if (active && order === undefined) setOrder(null);
        });
    }

    refresh();
    const interval = setInterval(refresh, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id, order]);

  if (order === undefined) {
    return (
      <>
        <PageHeader title={t("trackYourOrder")} />
        <Card className="mx-auto max-w-lg py-12 text-center text-muted rounded-2xl shadow-xs">
          {t("loading")}
        </Card>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <PageHeader title={t("trackYourOrder")} />
        <Card className="mx-auto max-w-lg py-12 text-center text-muted rounded-2xl shadow-xs">
          <p>Order not found.</p>
          <Link to="/customer/menu" className="mt-3 inline-block font-semibold text-primary">
            {t("browseMenu")}
          </Link>
        </Card>
      </>
    );
  }

  const current = order.status;
  const isPaid = order.payment.paid;
  const subtitle = `#${order.id} · ${ORDER_TYPE_LABEL[order.type]}`;

  async function handleCancel() {
    if (!order) return;
    setCancelling(true);
    setCancelError("");
    try {
      const updated = await cancelOrder(order.id);
      setOrder(updated);
    } catch (err) {
      console.error(err);
      setCancelError(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <PageHeader title={t("trackYourOrder")} description={subtitle} />

      <div className="mx-auto max-w-xl space-y-6">
        {cancelError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-danger">
            {cancelError}
          </div>
        )}

        {/* Stepper Card */}
        <Card className="rounded-2xl shadow-xs">
          <div className="mb-6 text-center">
            <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-surface-secondary text-primary shadow-xs">
              {order.type === "dine-in" ? (
                <UtensilsCrossed className="size-8" />
              ) : order.type === "takeaway" ? (
                <ShoppingBag className="size-8" />
              ) : (
                <Truck className="size-8" />
              )}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-foreground">
                {ORDER_STATUS_LABEL[current] || current}
              </h2>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2 text-xs">
              <Badge variant={isPaid ? "active" : "inactive"} className="font-bold">
                Payment: {PAYMENT_STATUS_LABEL[order.payment.status ?? (isPaid ? "paid" : "unpaid")]}
              </Badge>
              {order.prepTimeMinutes && current !== "completed" && current !== "cancelled" && current !== "served" && current !== "delivered" && (
                <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-muted font-semibold inline-flex items-center gap-1">
                  <Clock className="size-3 text-amber-500" />
                  <span>Prep Guidance: ~{order.prepTimeMinutes} mins</span>
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto py-2">
            <OrderStatusStepper status={current} type={order.type} />
          </div>

          {/* Fulfillment specific guidance */}
          <div className="mt-5 rounded-xl border border-border bg-surface-secondary/40 p-3.5 text-xs space-y-2">
            {order.type === "dine-in" && (
              <div>
                <div className="flex justify-between font-bold text-foreground">
                  <span>Reserved Dining Table:</span>
                  <span className="text-primary font-black">
                    {order.table || "Auto-assigned"}
                    {order.tableCapacity ? ` (${order.tableCapacity} seats)` : ""}
                  </span>
                </div>
                {order.partySize && (
                  <p className="text-muted mt-0.5">Party Size: {order.partySize} Guests</p>
                )}
                <p className="text-[11px] text-muted italic mt-1">
                  Please proceed to your table upon arrival. Our team will bring your dishes directly to you.
                </p>
              </div>
            )}

            {order.type === "takeaway" && (
              <div>
                <div className="flex justify-between font-bold text-foreground">
                  <span>Pickup Location:</span>
                  <span>Takeaway Counter</span>
                </div>
                <p className="text-muted mt-0.5">
                  Show your Order ID <strong>#{order.id}</strong> at the counter when you arrive.
                </p>
                {order.pickupInstructions && (
                  <p className="text-[11px] text-muted italic mt-1">
                    Notes: {order.pickupInstructions}
                  </p>
                )}
              </div>
            )}

            {order.type === "delivery" && (
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Delivery Address:</span>
                  <span className="text-muted font-normal text-right max-w-[240px] truncate">
                    {order.deliveryAddress}
                  </span>
                </div>
                {order.deliveryDistanceKm && (
                  <p className="text-muted">Distance from Restaurant: {order.deliveryDistanceKm} km</p>
                )}
                {order.handover ? (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>Handed over by {order.handover.staffName} at{" "}
                    {new Date(order.handover.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted italic">
                    Our courier will deliver directly to your specified address.
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Order Details summary */}
        <Card title={t("itemsOrdered")} className="rounded-2xl shadow-xs">
          <ul className="divide-y divide-border">
            {order.lines.map((line, idx) => (
              <li
                key={`${line.name}-${idx}`}
                className="flex items-center justify-between py-2 text-[13px]"
              >
                <span>
                  {line.quantity} × {line.name}
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {formatCurrency(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-border pt-3 space-y-1 text-xs">
            {order.subtotal !== undefined && (
              <div className="flex justify-between text-muted">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
              <div className="flex justify-between text-muted">
                <span>Delivery Fee:</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border font-bold text-foreground text-sm">
              <span>{t("total")}</span>
              <span className="text-lg text-primary font-black">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/customer/orders/${order.id}/receipt`}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover"
          >
            {t("receipt")} →
          </Link>

          {CANCELLABLE.includes(current) && (
            <Button
              variant="danger"
              disabled={cancelling}
              onClick={handleCancel}
              className="flex-1 rounded-xl"
            >
              {cancelling ? "Cancelling..." : t("cancel")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
