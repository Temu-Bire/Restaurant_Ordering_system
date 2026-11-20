import { useEffect, useState } from "react";
import Badge, { type BadgeVariant } from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Modal from "../../../shared/components/ui/Modal";
import Select from "../../../shared/components/ui/Select";
import { formatTimeAgo } from "../../../shared/utils/formatTimeAgo";
import { listStockMovements } from "../api/inventoryApi";
import {
  MOVEMENT_TYPE_LABEL,
  type MovementType,
  type StockMovement,
} from "../types";

interface StockMovementHistoryModalProps {
  open: boolean;
  ingredientId?: string;
  onClose: () => void;
}

export default function StockMovementHistoryModal({
  open,
  ingredientId,
  onClose,
}: StockMovementHistoryModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const data = await listStockMovements({
        ingredientId,
        type: typeFilter !== "all" ? (typeFilter as MovementType) : undefined,
        limit: 100,
      });
      setMovements(data);
    } catch (err) {
      console.error("Failed to load movements", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      void loadData();
    }
  }, [open, ingredientId, typeFilter]);

  const typeOptions = [
    { value: "all", label: "All Movement Types" },
    { value: "RECEIVE", label: "📦 Stock Received" },
    { value: "WASTE", label: "🗑 Waste / Spoilage" },
    { value: "COUNT", label: "📋 Physical Count" },
    { value: "ADJUSTMENT", label: "🔧 Manual Correction" },
    { value: "ORDER_CONSUMPTION", label: "🍲 Order Prepared" },
  ];

  const q = search.trim().toLowerCase();
  const visible = movements.filter(
    (m) =>
      !q ||
      m.ingredientName.toLowerCase().includes(q) ||
      m.reason.toLowerCase().includes(q) ||
      m.userName.toLowerCase().includes(q)
  );

  const badgeVariantForType: Record<MovementType, BadgeVariant> = {
    RECEIVE: "ok",
    WASTE: "low",
    COUNT: "info" as any,
    ADJUSTMENT: "pending",
    ORDER_CONSUMPTION: "neutral",
  };

  return (
    <Modal open={open} onClose={onClose} title="Inventory Stock Movement History">
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Filter and search bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <input
            type="text"
            placeholder="Search by item, reason, or staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-primary"
          />

          <div className="w-full sm:w-52">
            <Select
              id="type-filter"
              value={typeFilter}
              options={typeOptions}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Movement Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/70 text-muted font-bold border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Change</th>
                <th className="py-2.5 px-3">Prev / New</th>
                <th className="py-2.5 px-3">Reason & User</th>
                <th className="py-2.5 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    Loading stock movement logs...
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No movement records found.
                  </td>
                </tr>
              ) : (
                visible.map((m) => {
                  const isPositive = m.quantityChanged > 0;
                  const isZero = m.quantityChanged === 0;
                  return (
                    <tr key={m.id} className="hover:bg-surface-secondary/30">
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {m.ingredientName}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={badgeVariantForType[m.type] ?? "neutral"}
                          className="text-[10px] uppercase font-bold"
                        >
                          {MOVEMENT_TYPE_LABEL[m.type] ?? m.type}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isZero
                              ? "text-muted"
                              : "text-rose-500"
                          }
                        >
                          {isPositive ? `+${m.quantityChanged}` : m.quantityChanged} {m.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted font-mono text-[11px]">
                        {m.previousQuantity} → {m.newQuantity} {m.unit}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="text-foreground truncate max-w-[180px]">{m.reason || "—"}</p>
                        <span className="text-[10px] text-muted block">
                          By: {m.userName} ({m.userRole})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted whitespace-nowrap">
                        {formatTimeAgo(m.date)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
