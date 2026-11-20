import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import Input from "../../../shared/components/ui/Input";
import Select from "../../../shared/components/ui/Select";
import OptionPicker from "../../../shared/components/ui/OptionPicker";
import Modal from "../../../shared/components/ui/Modal";
import { useCart } from "../hooks/useCart";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { createOrder } from "../../orders/api/ordersApi";
import { getSettings } from "../../settings/api/settingsApi";
import { listTables } from "../../tables/api/tablesApi";
import type { RestaurantTable } from "../../tables/types";
import {
  type OrderType,
  type PaymentMethod,
} from "../../orders/types";
import { cn } from "../../../lib/cn";
import { formatCurrency } from "../../../shared/utils/formatCurrency";

export default function CartPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, count, subtotal, increase, decrease, removeItem, clear } =
    useCart();

  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [table, setTable] = useState("");
  const [tableError, setTableError] = useState("");
  const [tablesList, setTablesList] = useState<RestaurantTable[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const orderTypeOptions: { value: OrderType; label: string }[] = [
    { value: "dine-in", label: t("dineIn") },
    { value: "takeaway", label: t("takeaway") },
    { value: "delivery", label: t("delivery") },
  ];

  const paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: "cash", label: t("cash") },
    { value: "card", label: t("card") },
    { value: "mobile", label: t("mobile") },
  ];

  useEffect(() => {
    getSettings()
      .then((settings) => {
        if (typeof settings.deliveryFee === "number") {
          setDeliveryFee(settings.deliveryFee);
        }
      })
      .catch((err) => console.error("Failed to load settings in cart", err));

    listTables()
      .then(setTablesList)
      .catch((err) => console.error("Failed to load tables in cart", err));
  }, []);

  const fee = orderType === "delivery" ? deliveryFee : 0;
  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  const total = subtotal + fee + tax;

  const unavailableInCart = items.filter((i) => !i.available);

  async function handleConfirmOrder() {
    if (unavailableInCart.length > 0) {
      setSubmitError(
        `Please remove unavailable dishes (${unavailableInCart.map((i) => i.name).join(", ")}) before submitting.`
      );
      setReviewing(false);
      return;
    }

    if (orderType === "dine-in" && !table.trim()) {
      setTableError(t("tableRequired"));
      setReviewing(false);
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
      setReviewing(false);
      navigate(`/customer/orders/${order.id}/track`);
    } catch (err: unknown) {
      console.error("Order creation failed", err);
      const msg = err instanceof Error ? err.message : "Failed to place order. Try again.";
      setSubmitError(msg);
      setReviewing(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleReviewClick() {
    if (unavailableInCart.length > 0) {
      setSubmitError(
        `Remove unavailable item(s): ${unavailableInCart.map((i) => i.name).join(", ")}`
      );
      return;
    }
    if (orderType === "dine-in" && !table.trim()) {
      setTableError(t("tableRequired"));
      return;
    }
    setTableError("");
    setSubmitError("");
    setReviewing(true);
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader title={t("yourCart")} description="0 items" />
        <Card className="py-12 text-center rounded-2xl shadow-xs">
          <p className="text-base text-muted">{t("cartEmpty")}</p>
          <Link
            to="/customer/menu"
            className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover"
          >
            {t("browseMenu")}
          </Link>
        </Card>
      </>
    );
  }

  const tableOptions = [
    { value: "", label: "Choose an available table..." },
    ...tablesList.map((tbl) => ({
      value: tbl.name,
      label: `${tbl.name} (${tbl.seats} seats) - ${tbl.status.toUpperCase()}`,
    })),
  ];

  return (
    <>
      <PageHeader
        title={t("yourCart")}
        description={`${count} ${count === 1 ? "item" : "items"}`}
      />

      {unavailableInCart.length > 0 && (
        <div className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-semibold text-rose-500">
          ⚠️ Some items in your cart became unavailable:{" "}
          <span className="font-bold">{unavailableInCart.map((i) => i.name).join(", ")}</span>.
          Please remove them to proceed with your order.
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: items + order type */}
        <Card title={t("itemsOrdered")} className="rounded-2xl shadow-xs">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl shadow-xs",
                      item.gradient
                    )}
                  >
                    🍲
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                      {!item.available && (
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1 text-sm shadow-xs">
                    <button
                      type="button"
                      onClick={() => decrease(item.id)}
                      aria-label={`Decrease ${item.name}`}
                      className="size-6 font-bold text-muted hover:text-foreground"
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => increase(item.id)}
                      aria-label={`Increase ${item.name}`}
                      className="size-6 font-bold text-primary hover:text-primary-hover"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="p-1 text-muted hover:text-danger"
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <h3 className="mb-3 mt-6 text-sm font-bold text-foreground">{t("orderType")}</h3>
          <OptionPicker
            options={orderTypeOptions}
            value={orderType}
            onChange={setOrderType}
          />

          {orderType === "dine-in" && (
            <div className="mt-4 space-y-3">
              {tablesList.length > 0 ? (
                <div className="space-y-2">
                  <Select
                    id="table-select"
                    label="Select Table *"
                    value={table}
                    options={tableOptions}
                    onChange={(e) => setTable(e.target.value)}
                  />
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>Or enter manual table number:</span>
                    <input
                      type="text"
                      placeholder="e.g. 5"
                      value={table}
                      onChange={(e) => setTable(e.target.value)}
                      className="w-24 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground"
                    />
                  </div>
                  {tableError && <p className="text-xs text-danger">{tableError}</p>}
                </div>
              ) : (
                <Input
                  id="table"
                  label={t("tableNumber")}
                  placeholder={t("tablePlaceholder")}
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  error={tableError}
                />
              )}
            </div>
          )}
        </Card>

        {/* Right: summary + payment */}
        <div className="space-y-6">
          <Card title="Summary" className="rounded-2xl shadow-xs">
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between text-muted">
                <dt>{t("subtotal")}</dt>
                <dd className="font-semibold text-foreground">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>{t("tax")} (15%)</dt>
                <dd className="font-semibold text-foreground">{formatCurrency(tax)}</dd>
              </div>
              {orderType === "delivery" && (
                <div className="flex justify-between text-muted">
                  <dt>{t("deliveryFee")}</dt>
                  <dd className="font-semibold text-foreground">{formatCurrency(fee)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-bold text-foreground">{t("total")}</span>
              <span className="text-2xl font-black text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </Card>

          <Card title={t("paymentMethod")} className="rounded-2xl shadow-xs">
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
              size="lg"
              className="mt-5"
              disabled={submitting || unavailableInCart.length > 0}
              onClick={handleReviewClick}
            >
              Review & Place Order →
            </Button>
          </Card>
        </div>
      </div>

      {/* Order Review Modal */}
      {reviewing && (
        <Modal open onClose={() => setReviewing(false)} title="Review Your Order">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface-secondary/50 p-3 text-xs space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-muted">Order Type:</span>
                <span className="text-foreground capitalize">{orderType}</span>
              </div>
              {orderType === "dine-in" && (
                <div className="flex justify-between font-semibold">
                  <span className="text-muted">Table:</span>
                  <span className="text-foreground">{table}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span className="text-muted">Payment:</span>
                <span className="text-foreground capitalize">{payment}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Items ({count})
              </h4>
              <ul className="divide-y divide-border max-h-48 overflow-y-auto">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between py-2 text-xs">
                    <span className="font-semibold text-foreground">
                      {i.quantity} × {i.name}
                    </span>
                    <span className="text-muted font-mono">
                      {formatCurrency(i.price * i.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Tax (15%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              {orderType === "delivery" && (
                <div className="flex justify-between text-muted">
                  <span>Delivery Fee:</span>
                  <span>{formatCurrency(fee)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
                <span>Grand Total:</span>
                <span className="text-primary text-base font-black">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setReviewing(false)}>
                Back to Edit
              </Button>
              <Button disabled={submitting} onClick={handleConfirmOrder}>
                {submitting ? "Placing..." : "Confirm & Place Order"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
