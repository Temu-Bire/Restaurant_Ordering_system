import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import Card from "../../../shared/components/ui/Card";
import Button from "../../../shared/components/ui/Button";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { getOrder, verifyPayment } from "../../orders/api/ordersApi";
import type { Order } from "../../orders/types";

export default function ChapaCheckoutPage() {
  const { txRef } = useParams<{ txRef: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [method, setMethod] = useState<"telebirr" | "cbebirr" | "card">("telebirr");
  const [phoneNumber, setPhoneNumber] = useState("0911223344");
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!txRef) {
      setLoadError("Transaction reference is missing");
      setLoading(false);
      return;
    }

    getOrder(txRef)
      .then((data) => {
        setOrder(data);
        if (data.customerPhone) {
          setPhoneNumber(data.customerPhone);
        }
      })
      .catch((err) => {
        console.error("Failed to load order for Chapa checkout", err);
        setLoadError("Could not retrieve order details for this checkout session.");
      })
      .finally(() => setLoading(false));
  }, [txRef]);

  async function handlePay(outcome: "SUCCESS" | "FAILED" | "CANCELLED") {
    if (!order) return;
    setProcessing(true);
    setErrorMessage("");

    try {
      await verifyPayment(order.id, outcome, txRef);

      if (outcome === "SUCCESS") {
        setPaymentSuccess(true);
        setTimeout(() => {
          navigate(`/customer/orders/${order.id}/track`);
        }, 1500);
      } else if (outcome === "CANCELLED") {
        navigate(`/customer/orders/${order.id}/track`);
      } else {
        setErrorMessage("Payment verification failed. Please check your credentials and try again.");
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Payment processing error. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12 rounded-3xl shadow-lg">
          <div className="size-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-muted">Connecting to Chapa Hosted Checkout...</p>
        </Card>
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-10 rounded-3xl shadow-lg space-y-4">
          <div className="size-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Checkout Session Not Found</h2>
          <p className="text-xs text-muted leading-relaxed">
            {loadError || "The requested Chapa payment link could not be loaded."}
          </p>
          <Button variant="secondary" onClick={() => navigate("/customer/orders")} className="w-full">
            Return to My Orders
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg space-y-4">
        {/* Chapa Brand Bar */}
        <div className="bg-emerald-600 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-black text-lg">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight">Chapa Checkout</h1>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  Test Sandbox
                </span>
              </div>
              <p className="text-xs text-emerald-100">Arif Food Restaurant Gateway</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-200 block">Total Due</span>
            <span className="text-xl font-black text-white">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Main Checkout Card */}
        <Card className="rounded-3xl shadow-xl border border-border p-6 space-y-5 bg-surface">
          {/* Order Brief Summary */}
          <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
            <div>
              <span className="text-muted block">Order Reference:</span>
              <span className="font-bold text-foreground font-mono">#{order.id}</span>
            </div>
            <div className="text-right">
              <span className="text-muted block">Chapa tx_ref:</span>
              <span className="font-mono text-muted text-[11px] truncate max-w-[160px] inline-block" title={txRef}>
                {txRef}
              </span>
            </div>
          </div>

          {/* Test Notice */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <ShieldCheck className="size-4 shrink-0" />
              <span>Chapa Test Payment Mode</span>
            </div>
            <p className="text-[11px] text-muted">
              You are simulating a live Chapa checkout. No real money will be charged. Choose a test payment method below and authorize.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-500 flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {paymentSuccess && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>Payment authorized successfully! Redirecting to live order tracking...</span>
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted block">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod("telebirr")}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  method === "telebirr"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "border-border bg-surface-secondary text-muted hover:border-muted"
                }`}
              >
                <Smartphone className="size-4 text-amber-500" />
                <span>Telebirr</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("cbebirr")}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  method === "cbebirr"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "border-border bg-surface-secondary text-muted hover:border-muted"
                }`}
              >
                <Building2 className="size-4 text-purple-600" />
                <span>CBE Birr</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("card")}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  method === "card"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "border-border bg-surface-secondary text-muted hover:border-muted"
                }`}
              >
                <CreditCard className="size-4 text-blue-500" />
                <span>Bank Card</span>
              </button>
            </div>
          </div>

          {/* Method Input Form */}
          <div className="rounded-2xl border border-border bg-surface-secondary/40 p-4 space-y-3">
            {method !== "card" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {method === "telebirr" ? "Telebirr" : "CBE Birr"} Mobile Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0911223344"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground font-mono outline-hidden focus:border-emerald-500"
                />
                <p className="text-[11px] text-muted">
                  Test prompt will simulate an instant mobile wallet debit.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Test Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground font-mono outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Expiry</label>
                    <input
                      type="text"
                      defaultValue="12/28"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground font-mono outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">CVV</label>
                    <input
                      type="text"
                      defaultValue="123"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground font-mono outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button
              fullWidth
              size="lg"
              disabled={processing || paymentSuccess}
              onClick={() => handlePay("SUCCESS")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 shadow-md"
            >
              {processing
                ? "Connecting to Chapa & Verifying..."
                : `Authorize & Pay ${formatCurrency(order.total)} with Chapa`}
            </Button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={processing || paymentSuccess}
                onClick={() => handlePay("CANCELLED")}
                className="text-xs"
              >
                Cancel Checkout
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={processing || paymentSuccess}
                onClick={() => handlePay("FAILED")}
                className="text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
              >
                Simulate Payment Failure
              </Button>
            </div>
          </div>
        </Card>

        {/* Security Trust Footer */}
        <p className="text-center text-[11px] text-muted flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>Secured by Chapa Financial Technologies · 256-bit Encryption</span>
        </p>
      </div>
    </div>
  );
}
