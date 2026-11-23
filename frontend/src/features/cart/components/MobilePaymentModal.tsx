import { useEffect, useState, type ReactNode } from "react";
import { Smartphone, Building2, CreditCard, Clock, AlertTriangle } from "lucide-react";
import Button from "../../../shared/components/ui/Button";
import Modal from "../../../shared/components/ui/Modal";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { verifyPayment, type VerifyPaymentResponse } from "../../orders/api/ordersApi";

interface MobilePaymentModalProps {
  open: boolean;
  orderId: string; // "ORD-1001" or UUID
  totalAmount: number;
  provider: string; // "Telebirr" | "CBE Birr" | "Chapa"
  onSuccess: (res: VerifyPaymentResponse) => void;
  onFailed: (msg: string) => void;
  onCancel: () => void;
}

export default function MobilePaymentModal({
  open,
  orderId,
  totalAmount,
  provider,
  onSuccess,
  onFailed,
  onCancel,
}: MobilePaymentModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60); // 15 mins hold
  const [pin, setPin] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleVerify(outcome: "SUCCESS" | "FAILED" | "CANCELLED" | "EXPIRED") {
    setProcessing(true);
    setErrorMessage("");
    try {
      const res = await verifyPayment(orderId, outcome);
      if (outcome === "SUCCESS") {
        onSuccess(res);
      } else if (outcome === "CANCELLED") {
        onCancel();
      } else {
        onFailed(
          outcome === "EXPIRED"
            ? "Payment session timed out. Table hold released."
            : "Payment verification failed. Please try again."
        );
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Payment verification error");
    } finally {
      setProcessing(false);
    }
  }

  function handleExpire() {
    void handleVerify("EXPIRED");
  }

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerDisplay = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const providerThemes: Record<string, { bg: string; text: string; badge: string; icon: ReactNode }> = {
    Telebirr: {
      bg: "bg-amber-500/10 border-amber-500/30",
      text: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-500 text-white",
      icon: <Smartphone className="size-6 text-amber-500" />,
    },
    "CBE Birr": {
      bg: "bg-purple-500/10 border-purple-500/30",
      text: "text-purple-600 dark:text-purple-400",
      badge: "bg-purple-600 text-white",
      icon: <Building2 className="size-6 text-purple-600" />,
    },
    Chapa: {
      bg: "bg-emerald-500/10 border-emerald-500/30",
      text: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-600 text-white",
      icon: <CreditCard className="size-6 text-emerald-600" />,
    },
  };

  const theme = providerThemes[provider] ?? providerThemes.Telebirr;

  return (
    <Modal open={open} onClose={() => {}} title="Mobile Payment Gateway">
      <div className="space-y-4">
        {/* Provider Header Banner */}
        <div className={`flex items-center justify-between rounded-2xl border p-4 ${theme.bg}`}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-surface shadow-xs">
              {theme.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-foreground text-sm">{provider} Payment</h4>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${theme.badge}`}>
                  Live Simulation
                </span>
              </div>
              <p className="text-xs text-muted">Order ID: #{orderId}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-muted block">Amount Due</span>
            <span className="text-lg font-black text-primary">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Temporary Hold Countdown Notice */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary/40 px-3.5 py-2 text-xs">
          <span className="text-muted flex items-center gap-1.5">
            <Clock className="size-3.5 text-amber-500" />
            <span>Temporary Order Hold:</span>
          </span>
          <span className="font-mono font-bold text-amber-500">{timerDisplay}</span>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-500 flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Payment authorization form */}
        <div className="space-y-3 rounded-2xl border border-border p-4 bg-surface">
          <p className="text-xs text-muted">
            A payment request was sent to your <strong>{provider}</strong> account. Please authorize the transaction or enter your confirmation PIN:
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              {provider} PIN or Code
            </label>
            <input
              type="password"
              maxLength={6}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center tracking-widest text-lg font-mono rounded-xl border border-border bg-surface px-4 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          <p className="text-[11px] text-muted text-center">
            Once authorized, your table reservation and order ticket will be confirmed instantly.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            fullWidth
            size="lg"
            disabled={processing}
            onClick={() => handleVerify("SUCCESS")}
            className="font-bold"
          >
            {processing ? `Verifying with ${provider}...` : "Authorize Payment"}
          </Button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={processing}
              onClick={() => handleVerify("CANCELLED")}
              className="text-xs"
            >
              Cancel Payment & Release Hold
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={processing}
              onClick={() => handleVerify("FAILED")}
              className="text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
            >
              Simulate Failure
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
