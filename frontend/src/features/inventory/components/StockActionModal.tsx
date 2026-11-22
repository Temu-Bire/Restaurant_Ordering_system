import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "../../../shared/components/ui/Button";
import Input from "../../../shared/components/ui/Input";
import Modal from "../../../shared/components/ui/Modal";
import Select from "../../../shared/components/ui/Select";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import type { Ingredient } from "../types";

export type StockActionMode = "receive" | "waste" | "count" | "adjust";

interface StockActionModalProps {
  open: boolean;
  item: Ingredient;
  mode: StockActionMode;
  onClose: () => void;
  onReceive: (id: string, data: { quantity: number; costPerUnit?: number; notes?: string }) => Promise<void>;
  onWaste: (id: string, data: { quantity: number; reason: string; notes?: string }) => Promise<void>;
  onCount: (id: string, data: { countedStock: number; notes?: string }) => Promise<void>;
  onAdjust: (id: string, data: { newStock: number; reason: string }) => Promise<void>;
}

export default function StockActionModal({
  open,
  item,
  mode,
  onClose,
  onReceive,
  onWaste,
  onCount,
  onAdjust,
}: StockActionModalProps) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState("");
  const [costPerUnit, setCostPerUnit] = useState(String(item.unitCost || ""));
  const [wasteReason, setWasteReason] = useState("Expired");
  const [notes, setNotes] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("Audit correction");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentStock = item.stock;
  const countedNum = Number(quantity);
  const variance = !Number.isNaN(countedNum) ? countedNum - currentStock : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const val = Number(quantity);
    if (Number.isNaN(val) || val < 0) {
      setError("Please enter a valid non-negative quantity");
      return;
    }

    setSaving(true);
    try {
      if (mode === "receive") {
        if (val <= 0) {
          setError("Received quantity must be greater than zero");
          setSaving(false);
          return;
        }
        await onReceive(item.id, {
          quantity: val,
          costPerUnit: costPerUnit ? Number(costPerUnit) : undefined,
          notes: notes.trim() || undefined,
        });
      } else if (mode === "waste") {
        if (val <= 0) {
          setError("Wasted quantity must be greater than zero");
          setSaving(false);
          return;
        }
        if (val > currentStock) {
          setError(`Cannot record waste greater than current stock (${currentStock} ${item.unit})`);
          setSaving(false);
          return;
        }
        await onWaste(item.id, {
          quantity: val,
          reason: wasteReason,
          notes: notes.trim() || undefined,
        });
      } else if (mode === "count") {
        await onCount(item.id, {
          countedStock: val,
          notes: notes.trim() || undefined,
        });
      } else if (mode === "adjust") {
        await onAdjust(item.id, {
          newStock: val,
          reason: adjustmentReason.trim() || "Manual correction",
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record stock movement");
    } finally {
      setSaving(false);
    }
  }

  const titles: Record<StockActionMode, string> = {
    receive: `Receive Stock: ${item.name}`,
    waste: `Record Waste: ${item.name}`,
    count: `Physical Count: ${item.name}`,
    adjust: `Stock Correction: ${item.name}`,
  };

  const wasteReasonOptions = [
    { value: "Expired", label: "Expired" },
    { value: "Spoilage", label: "Spoilage" },
    { value: "Spillage", label: "Spillage" },
    { value: "Damaged", label: "Damaged" },
    { value: "Quality Defect", label: "Quality Defect" },
  ];

  return (
    <Modal open={open} onClose={onClose} title={titles[mode]}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs font-semibold text-rose-500 flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Current status banner */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary/40 p-3 text-xs">
          <div>
            <span className="font-bold text-foreground block">{item.name}</span>
            <span className="text-muted">SKU: {item.sku || "N/A"} · Category: {item.category}</span>
          </div>
          <div className="text-right">
            <span className="text-muted block">Current Stock</span>
            <span className="font-bold text-sm text-foreground">
              {item.stock} {item.unit}
            </span>
          </div>
        </div>

        {/* MODE: RECEIVE */}
        {mode === "receive" && (
          <div className="space-y-3">
            <Input
              id="receive-qty"
              label={`Received Quantity (${item.unit}) *`}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 25"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <Input
              id="receive-cost"
              label="Updated Unit Cost (ETB, Optional)"
              type="number"
              step="0.01"
              min="0"
              placeholder={`Current: ${item.unitCost} ETB`}
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
            />

            <Input
              id="receive-notes"
              label="Receiving Notes (Optional)"
              placeholder="e.g. Fresh shipment delivered"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}

        {/* MODE: WASTE */}
        {mode === "waste" && (
          <div className="space-y-3">
            <Input
              id="waste-qty"
              label={`Quantity Wasted (${item.unit}) *`}
              type="number"
              step="0.01"
              min="0.01"
              max={item.stock}
              placeholder="e.g. 2.5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <Select
              id="waste-reason"
              label="Reason for Waste *"
              value={wasteReason}
              options={wasteReasonOptions}
              onChange={(e) => setWasteReason(e.target.value)}
            />

            <Input
              id="waste-notes"
              label="Notes (Optional)"
              placeholder="e.g. Discarded during morning inspection"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}

        {/* MODE: COUNT */}
        {mode === "count" && (
          <div className="space-y-3">
            <Input
              id="count-qty"
              label={`Physically Counted Stock (${item.unit}) *`}
              type="number"
              step="0.01"
              min="0"
              placeholder={`Current: ${currentStock}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            {quantity.trim() !== "" && !Number.isNaN(countedNum) && (
              <div className="rounded-xl border border-border bg-surface-secondary/50 p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Recorded:</span>
                  <span className="font-bold">{currentStock} {item.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Counted:</span>
                  <span className="font-bold">{countedNum} {item.unit}</span>
                </div>
                <div className="flex justify-between border-t border-border mt-1.5 pt-1.5 font-bold">
                  <span>Variance:</span>
                  <span className={variance >= 0 ? "text-emerald-500" : "text-rose-500"}>
                    {variance > 0 ? `+${variance}` : variance} {item.unit}
                  </span>
                </div>
              </div>
            )}

            <Input
              id="count-notes"
              label="Audit Notes (Optional)"
              placeholder="e.g. Monthly physical inventory"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}

        {/* MODE: ADJUST */}
        {mode === "adjust" && (
          <div className="space-y-3">
            <Input
              id="adjust-qty"
              label={`Corrected Stock Level (${item.unit}) *`}
              type="number"
              step="0.01"
              min="0"
              placeholder={`Current: ${currentStock}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <Input
              id="adjust-reason"
              label="Correction Reason *"
              placeholder="e.g. Audit correction"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : t("confirm")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
