import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import OptionPicker from "../../components/ui/OptionPicker";
import { useCart } from "../../features/cart/useCart";
import { createOrder } from "../../features/orders/ordersApi";
import { getSettings } from "../../features/settings/settingsApi";
import {
  orderTypeOptions,
  paymentOptions,
  type OrderType,
  type PaymentMethod,
} from "../../features/orders/types";
import { cn } from "../../lib/cn";
import { formatCurrency } from "../../utils/formatCurrency";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, count, subtotal, increase, decrease, removeItem, clear } =
    useCart();

  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [table, setTable] = useState("");
  const [tableError, setTableError] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    getSettings()
      .then((settings) => {
        if (typeof settings.deliveryFee === "number") {
          setDeliveryFee(settings.deliveryFee);
        }
      })
      .catch((err) => console.error("Failed to load settings in cart", err));
  }, []);

  const fee = orderType === "delivery" ? deliveryFee : 0;
  const total = subtotal + fee;

  async function placeOrder() {
    if (orderType === "dine-in" && !table.trim()) {
      setTableError("Table number is required");
      return;
    }
    setTableError("");
    setSubmitError("");
    setSubmitting(true);

    try {
      const order = await createOrder({
        type: orderType,
        table: orderType === "dine-in" ? table.trim() : undefined,
        paymentMethod: payment,
        items: items.map((item) => ({ foodId: item.id, quantity: item.quantity })),
      });
      clear();
      navigate(`/customer/orders/${order.id}/track`);
    } catch (err: unknown) {
      console.error("Order creation failed", err);
      const msg = err instanceof Error ? err.message : "Failed to place order. Try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Your Cart" description="0 items" />
        <Card className="py-12 text-center">
          <p className="text-muted">Your cart is empty.</p>
          <Link
            to="/customer/menu"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Browse Menu →
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Your Cart"
        description={`${count} ${count === 1 ? "item" : "items"}`}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        {/* Left: items + order type */}
        <Card title="Items">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3">
                <div
                  className={cn(
                    "size-10 shrink-0 rounded-lg bg-gradient-to-br",
                    item.gradient
                  )}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold">{item.name}</p>
                  <p className="text-xs text-muted">
                    {formatCurrency(item.price)}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-full border border-border px-3 py-1 text-sm">
                  <button
                    onClick={() => decrease(item.id)}
                    aria-label={`Decrease ${item.name}`}
                  >
                    −
                  </button>
                  <span className="w-4 text-center font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => increase(item.id)}
                    aria-label={`Increase ${item.name}`}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="text-danger"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>

          <h3 className="mb-3 mt-6 text-base font-bold">Order Type</h3>
          <OptionPicker
            options={orderTypeOptions}
            value={orderType}
            onChange={setOrderType}
          />

          {orderType === "dine-in" && (
            <div className="mt-4">
              <Input
                id="table"
                label="Table Number"
                placeholder="T2"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                error={tableError}
              />
            </div>
          )}
        </Card>

        {/* Right: summary + payment */}
        <div className="space-y-5">
          <Card title="Summary">
            <dl className="space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery Fee</dt>
                <dd>{formatCurrency(fee)}</dd>
              </div>
            </dl>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-[13px] font-bold">Total</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </Card>

          <Card title="Payment Method">
            <OptionPicker
              options={paymentOptions}
              value={payment}
              onChange={setPayment}
            />
            {submitError && (
              <p className="mt-3 text-xs text-danger">{submitError}</p>
            )}
            <Button
              fullWidth
              className="mt-4"
              disabled={submitting}
              onClick={placeOrder}
            >
              {submitting ? "Placing Order..." : "Place Order →"}
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
