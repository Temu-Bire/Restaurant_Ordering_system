import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  Trash2,
  AlertTriangle,
  Sparkles,
  Lock,
  MapPin,
  Home,
  Briefcase,
  CheckCircle2,
  CreditCard,
} from "lucide-react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import Input from "../../../shared/components/ui/Input";
import OptionPicker from "../../../shared/components/ui/OptionPicker";
import Modal from "../../../shared/components/ui/Modal";
import { useCart } from "../hooks/useCart";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { createOrder } from "../../orders/api/ordersApi";
import { listTables } from "../../tables/api/tablesApi";
import { listAddresses, createAddress } from "../../addresses/api/addressesApi";
import { getDeliveryQuote } from "../../delivery/api/deliveryApi";
import type { DeliveryAddress } from "../../addresses/types";
import type { DeliveryQuote } from "../../delivery/types";
import type { RestaurantTable } from "../../tables/types";
import type { OrderType } from "../../orders/types";
import { cn } from "../../../lib/cn";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import AddressFormModal from "../../addresses/components/AddressFormModal";

export default function CartPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, count, subtotal, increase, decrease, removeItem, clear } = useCart();

  const [orderType, setOrderType] = useState<OrderType>("dine-in");

  // Dine-in party size and auto-table assignment
  const [partySize, setPartySize] = useState<number>(2);
  const [tablesList, setTablesList] = useState<RestaurantTable[]>([]);

  // Takeaway instructions
  const [pickupInstructions, setPickupInstructions] = useState<string>(
    "Collect at restaurant takeaway counter"
  );

  // Delivery address & quote
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Checkout and payment states
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const orderTypeOptions: { value: OrderType; label: string }[] = [
    { value: "dine-in", label: "Dine-in" },
    { value: "takeaway", label: "Takeaway" },
    { value: "delivery", label: "Delivery" },
  ];

  useEffect(() => {
    // Load tables
    listTables()
      .then(setTablesList)
      .catch((err) => console.error("Failed to load tables in cart", err));

    // Load customer addresses
    listAddresses()
      .then((list) => {
        setAddresses(list);
        const defaultAddr = list.find((a) => a.isDefault) ?? list[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        }
      })
      .catch((err) => console.error("Failed to load addresses in cart", err));
  }, []);

  // Recalculate delivery quote when selected address or subtotal changes
  useEffect(() => {
    if (orderType !== "delivery" || !selectedAddressId) {
      setDeliveryQuote(null);
      return;
    }

    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (!addr) return;

    getDeliveryQuote({
      latitude: addr.latitude,
      longitude: addr.longitude,
      subtotal,
    })
      .then(setDeliveryQuote)
      .catch((err) => {
        console.error("Quote error:", err);
        setDeliveryQuote(null);
      });
  }, [orderType, selectedAddressId, subtotal, addresses]);

  // Compute smallest available table for Dine-in
  const availableTables = tablesList.filter(
    (t) => (t.status === "available" || t.status === "free") && t.seats >= partySize
  );
  availableTables.sort((a, b) => {
    if (a.seats === partySize && b.seats !== partySize) return -1;
    if (b.seats === partySize && a.seats !== partySize) return 1;
    return a.seats - b.seats;
  });
  const assignedTable = availableTables[0] ?? null;

  // Estimated preparation arrival guidance
  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const estimatedPrepMinutes = Math.min(45, Math.max(15, 15 + (totalQuantity - 1) * 2));

  // Pricing calculations
  const fee = orderType === "delivery" ? (deliveryQuote?.fee ?? 0) : 0;
  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  const total = subtotal + fee + tax;

  const unavailableInCart = items.filter((i) => !i.available);

  // Address helper for display
  const currentAddress = addresses.find((a) => a.id === selectedAddressId);

  async function handleAddressSaved(newAddress: DeliveryAddress) {
    setAddresses((prev) => [newAddress, ...prev.filter((a) => a.id !== newAddress.id)]);
    setSelectedAddressId(newAddress.id);
  }

  function handleReviewClick() {
    if (unavailableInCart.length > 0) {
      setSubmitError(
        `Remove unavailable item(s): ${unavailableInCart.map((i) => i.name).join(", ")}`
      );
      return;
    }

    if (orderType === "dine-in" && !assignedTable) {
      setSubmitError(`No table is currently available for a party of ${partySize}. Please adjust party size.`);
      return;
    }

    if (orderType === "delivery") {
      if (!selectedAddressId) {
        setSubmitError("Please select or add a delivery address.");
        return;
      }
      if (deliveryQuote && !deliveryQuote.eligible) {
        setSubmitError(deliveryQuote.message || "Your address is outside the delivery boundary.");
        return;
      }
    }

    setSubmitError("");
    setReviewing(true);
  }

  async function handleProceedToPayment() {
    setSubmitError("");
    setSubmitting(true);

    try {
      const order = await createOrder({
        type: orderType,
        partySize: orderType === "dine-in" ? partySize : undefined,
        addressId: orderType === "delivery" ? selectedAddressId : undefined,
        pickupInstructions: orderType === "takeaway" ? pickupInstructions : undefined,
        paymentMethod: "mobile",
        paymentProvider: "Chapa",
        items: items.map((item) => ({ foodId: item.id, quantity: item.quantity })),
      });

      setReviewing(false);
      clear();

      const checkoutUrl = order.payment?.checkoutUrl;
      const txRef = order.payment?.txRef || order.id;

      if (checkoutUrl) {
        if (checkoutUrl.startsWith("http") && !checkoutUrl.includes(window.location.host)) {
          window.location.href = checkoutUrl;
        } else {
          try {
            const parsed = new URL(checkoutUrl, window.location.origin);
            navigate(`${parsed.pathname}${parsed.search}`);
          } catch {
            navigate(`/chapa-checkout/${txRef}`);
          }
        }
      } else {
        navigate(`/chapa-checkout/${txRef}`);
      }
    } catch (err: unknown) {
      console.error("Order creation failed", err);
      const msg = err instanceof Error ? err.message : "Failed to place order. Try again.";
      setSubmitError(msg);
      setReviewing(false);
    } finally {
      setSubmitting(false);
    }
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

  return (
    <>
      <PageHeader
        title={t("yourCart")}
        description={`${count} ${count === 1 ? "item" : "items"}`}
      />

      {unavailableInCart.length > 0 && (
        <div className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-semibold text-rose-500 flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0 text-rose-500" />
          <span>
            Some items in your cart became unavailable:{" "}
            <span className="font-bold">{unavailableInCart.map((i) => i.name).join(", ")}</span>.
            Please remove them to proceed with your order.
          </span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Items + Order Type Specific Config */}
        <div className="space-y-6">
          <Card title={t("itemsOrdered")} className="rounded-2xl shadow-xs">
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-primary shadow-xs",
                        item.gradient
                      )}
                    >
                      <UtensilsCrossed className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                        {!item.available && (
                          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                            {t("unavailable")}
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
                      className="p-1.5 text-muted hover:text-danger rounded-lg transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Fulfillment details */}
          <Card title="Fulfillment Options" className="rounded-2xl shadow-xs">
            <h3 className="mb-3 text-sm font-bold text-foreground">{t("orderType")}</h3>
            <OptionPicker
              options={orderTypeOptions}
              value={orderType}
              onChange={(val) => setOrderType(val as OrderType)}
            />

            {/* DINE-IN CONFIG */}
            {orderType === "dine-in" && (
              <div className="mt-5 space-y-4 rounded-xl border border-border bg-surface-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Number of Guests (Party Size):
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 4, 6, 8].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPartySize(size)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
                          partySize === size
                            ? "bg-primary text-white"
                            : "bg-surface border border-border text-foreground hover:bg-surface-secondary"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={partySize}
                      onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-center font-bold text-foreground"
                    />
                  </div>
                </div>

                {assignedTable ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-emerald-500" />
                        <span>Auto-Assigned Best Table:</span>
                      </span>
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                        {assignedTable.seats} Seats
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-foreground">{assignedTable.name}</p>
                    {assignedTable.section && (
                      <p className="text-[11px] text-muted">Section: {assignedTable.section}</p>
                    )}
                    <p className="text-[11px] text-muted pt-1 flex items-center gap-1">
                      <Lock className="size-3 text-muted inline" />
                      <span>Table will be held for 15 minutes during payment and confirmed upon success.</span>
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                    <span>No table is currently available for {partySize} guests. Please wait or try a different party size.</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted border-t border-border pt-3">
                  <span>Estimated Kitchen Preparation Time:</span>
                  <span className="font-bold text-foreground">~{estimatedPrepMinutes} mins arrival guidance</span>
                </div>
              </div>
            )}

            {/* TAKEAWAY CONFIG */}
            {orderType === "takeaway" && (
              <div className="mt-5 space-y-3 rounded-xl border border-border bg-surface-secondary/30 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Pickup Location:</span>
                  <span className="text-muted">Restaurant Main Takeaway Counter</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Estimated Ready Time:</span>
                  <span className="font-bold text-foreground">~{estimatedPrepMinutes} mins</span>
                </div>

                <Input
                  id="pickupInstructions"
                  label="Pickup Instructions"
                  placeholder="e.g. Will pick up in 20 minutes"
                  value={pickupInstructions}
                  onChange={(e) => setPickupInstructions(e.target.value)}
                />
              </div>
            )}

            {/* DELIVERY CONFIG */}
            {orderType === "delivery" && (
              <div className="mt-5 space-y-4 rounded-xl border border-border bg-surface-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">Delivery Address</h4>
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(true)}
                    className="text-xs font-bold text-primary hover:text-primary-hover"
                  >
                    + Add New Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-4 rounded-xl border border-dashed border-border p-3">
                    <p className="text-xs text-muted mb-2">No saved delivery addresses found.</p>
                    <Button size="sm" onClick={() => setAddressModalOpen(true)}>
                      <MapPin className="size-3.5 inline mr-1" />
                      <span>Add Delivery Address</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid gap-2">
                      {addresses.map((addr) => {
                        const isSelected = addr.id === selectedAddressId;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={cn(
                              "cursor-pointer rounded-xl border p-3 text-xs transition-all",
                              isSelected
                                ? "border-primary bg-primary/5 shadow-xs"
                                : "border-border bg-surface hover:border-border-hover"
                            )}
                          >
                            <div className="flex items-center justify-between font-bold text-foreground">
                              <span className="capitalize flex items-center gap-1.5">
                                {addr.label === "home" ? (
                                  <Home className="size-3.5 text-primary" />
                                ) : addr.label === "work" ? (
                                  <Briefcase className="size-3.5 text-primary" />
                                ) : (
                                  <MapPin className="size-3.5 text-primary" />
                                )}
                                <span>{addr.label} {addr.isDefault && "(Default)"}</span>
                              </span>
                              <span className="text-muted font-normal">{addr.phone}</span>
                            </div>
                            <p className="mt-1 text-muted">
                              {addr.building ? `${addr.building}, ` : ""}
                              {addr.street}, {addr.area}, {addr.city}
                              {addr.landmark ? ` (Near ${addr.landmark})` : ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Live Distance & Tier Fee Quote Result */}
                {deliveryQuote && (
                  <div
                    className={cn(
                      "rounded-xl border p-3 text-xs space-y-1.5",
                      deliveryQuote.eligible
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-500"
                    )}
                  >
                    <div className="flex justify-between font-bold">
                      <span>Calculated Distance:</span>
                      <span>{deliveryQuote.distanceKm} km</span>
                    </div>

                    {deliveryQuote.eligible ? (
                      <>
                        <div className="flex justify-between font-semibold text-muted">
                          <span>Tier Delivery Fee:</span>
                          <span className="font-bold text-foreground">
                            {formatCurrency(deliveryQuote.fee)}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 text-emerald-500" />
                          <span>Address is within our {deliveryQuote.maxDistanceKm} km service boundary.</span>
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold">{deliveryQuote.message}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Payment & Summary */}
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
              <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
            </div>
          </Card>

          {/* Payment Method - Mobile Payment via Chapa Only */}
          <Card title="Payment Method (Chapa Gateway)" className="rounded-2xl shadow-xs">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-surface shadow-xs border border-border">
                  <CreditCard className="size-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">Mobile Payment (Chapa)</span>
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                      Secured
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Telebirr, CBE Birr, AwashBirr & Bank Cards supported
                  </p>
                </div>
              </div>
            </div>

            {submitError && (
              <p className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-danger font-semibold">
                {submitError}
              </p>
            )}

            <Button
              fullWidth
              size="lg"
              className="mt-5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={
                submitting ||
                unavailableInCart.length > 0 ||
                (orderType === "dine-in" && !assignedTable) ||
                (orderType === "delivery" && (!selectedAddressId || Boolean(deliveryQuote && !deliveryQuote.eligible)))
              }
              onClick={handleReviewClick}
            >
              Review & Pay with Chapa
            </Button>
          </Card>
        </div>
      </div>

      {/* Review Order Modal */}
      {reviewing && (
        <Modal open onClose={() => setReviewing(false)} title="Confirm Order Details">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface-secondary/50 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-muted">Order Type:</span>
                <span className="text-foreground uppercase font-bold">{orderType}</span>
              </div>

              {orderType === "dine-in" && assignedTable && (
                <>
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted">Party Size:</span>
                    <span className="text-foreground">{partySize} Guests</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted">Assigned Table:</span>
                    <span className="text-primary font-bold">{assignedTable.name} ({assignedTable.seats} Seats)</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted">Prep Time Guidance:</span>
                    <span className="text-foreground">~{estimatedPrepMinutes} mins</span>
                  </div>
                </>
              )}

              {orderType === "takeaway" && (
                <div className="flex justify-between font-semibold">
                  <span className="text-muted">Pickup Notes:</span>
                  <span className="text-foreground">{pickupInstructions}</span>
                </div>
              )}

              {orderType === "delivery" && currentAddress && (
                <>
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted">Deliver To:</span>
                    <span className="text-foreground font-bold">{currentAddress.recipientName} ({currentAddress.phone})</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted">Address:</span>
                    <span className="text-foreground text-right max-w-[200px] truncate">
                      {currentAddress.street}, {currentAddress.area}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted">Distance:</span>
                    <span className="text-foreground">{deliveryQuote?.distanceKm} km</span>
                  </div>
                </>
              )}

              <div className="flex justify-between font-semibold border-t border-border pt-1.5">
                <span className="text-muted">Payment:</span>
                <span className="text-foreground font-bold">Mobile (Chapa)</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Items ({count})
              </h4>
              <ul className="divide-y divide-border max-h-40 overflow-y-auto">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between py-1.5 text-xs">
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
                <span>Total Due:</span>
                <span className="text-primary text-base font-black">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setReviewing(false)}>
                Back to Edit
              </Button>
              <Button disabled={submitting} onClick={handleProceedToPayment} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {submitting ? "Initiating..." : "Proceed to Pay with Chapa"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Address Form Modal */}
      <AddressFormModal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSaved={handleAddressSaved}
        saveFn={createAddress}
      />
    </>
  );
}
