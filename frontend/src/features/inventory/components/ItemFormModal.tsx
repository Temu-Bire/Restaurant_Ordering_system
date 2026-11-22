import { useEffect, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import Button from "../../../shared/components/ui/Button";
import Input from "../../../shared/components/ui/Input";
import Modal from "../../../shared/components/ui/Modal";
import Select from "../../../shared/components/ui/Select";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import type {
  CreateInventoryItemInput,
  Ingredient,
  InventoryCategory,
  InventoryStatus,
} from "../types";

interface ItemFormModalProps {
  open: boolean;
  itemToEdit?: Ingredient | null;
  role: "admin" | "staff";
  onClose: () => void;
  onSave: (data: CreateInventoryItemInput) => Promise<void>;
}

export default function ItemFormModal({
  open,
  itemToEdit,
  role,
  onClose,
  onSave,
}: ItemFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<InventoryCategory>("ingredients");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("0");
  const [minimum, setMinimum] = useState("5");
  const [unit, setUnit] = useState("kg");
  const [unitCost, setUnitCost] = useState("0");
  const [expiryDate, setExpiryDate] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [status, setStatus] = useState<InventoryStatus>("active");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(itemToEdit);
  const isStaff = role === "staff";

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCategory(itemToEdit.category);
      setSku(itemToEdit.sku ?? "");
      setStock(String(itemToEdit.stock));
      setMinimum(String(itemToEdit.minimum));
      setUnit(itemToEdit.unit);
      setUnitCost(String(itemToEdit.unitCost));
      setExpiryDate(
        itemToEdit.expiryDate ? itemToEdit.expiryDate.split("T")[0] : ""
      );
      setStorageLocation(itemToEdit.storageLocation ?? "");
      setStatus(itemToEdit.status);
    } else {
      setName("");
      setCategory("ingredients");
      setSku("");
      setStock("0");
      setMinimum("5");
      setUnit("kg");
      setUnitCost("0");
      setExpiryDate("");
      setStorageLocation("");
      setStatus("active");
    }
    setError("");
  }, [itemToEdit, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Item name is required");
      return;
    }

    const stockNum = Number(stock);
    const minNum = Number(minimum);
    const costNum = Number(unitCost);

    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError("Stock must be a positive number or zero");
      return;
    }
    if (Number.isNaN(minNum) || minNum < 0) {
      setError("Minimum threshold must be a positive number or zero");
      return;
    }
    if (Number.isNaN(costNum) || costNum < 0) {
      setError("Unit cost must be a positive number or zero");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        sku: sku.trim() || undefined,
        stock: !isEdit ? stockNum : undefined,
        minimum: !isStaff ? minNum : undefined,
        unit: unit.trim() || "kg",
        unitCost: !isStaff ? costNum : undefined,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        storageLocation: storageLocation.trim() || undefined,
        status,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  }

  const categoryOptions = [
    { value: "ingredients", label: "Ingredients" },
    { value: "beverages", label: "Beverages" },
    { value: "dry_goods", label: "Dry Goods" },
    { value: "packaging", label: "Packaging" },
    { value: "supplies", label: "Supplies" },
  ];

  const unitOptions = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "g", label: "Grams (g)" },
    { value: "L", label: "Liters (L)" },
    { value: "ml", label: "Milliliters (ml)" },
    { value: "pcs", label: "Pieces (pcs)" },
    { value: "packs", label: "Packs" },
    { value: "bottles", label: "Bottles" },
    { value: "cans", label: "Cans" },
    { value: "boxes", label: "Boxes" },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${itemToEdit?.name}` : "Add New Inventory Item"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[78vh] overflow-y-auto px-1">
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-500 flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="item-name"
            label="Item Name *"
            placeholder="e.g. Teff Flour"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            id="item-category"
            label="Category *"
            value={category}
            options={categoryOptions}
            onChange={(e) => setCategory(e.target.value as InventoryCategory)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="item-sku"
            label="SKU Code"
            placeholder="Auto-generated if blank"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
          <Select
            id="item-unit"
            label="Measurement Unit *"
            value={unit}
            options={unitOptions}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {!isEdit ? (
            <Input
              id="item-stock"
              label={`Initial Stock (${unit})`}
              type="number"
              step="0.01"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted block">Current Stock</label>
              <div className="rounded-xl border border-border bg-surface-secondary/50 px-3 py-2 text-xs font-bold text-foreground">
                {stock} {unit}
              </div>
            </div>
          )}

          <Input
            id="item-minimum"
            label={`Min. Threshold (${unit}) *`}
            type="number"
            step="0.01"
            min="0"
            disabled={isStaff}
            value={minimum}
            onChange={(e) => setMinimum(e.target.value)}
          />

          <Input
            id="item-cost"
            label="Unit Cost (ETB) *"
            type="number"
            step="0.01"
            min="0"
            disabled={isStaff}
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </div>

        {isStaff && isEdit && (
          <p className="text-[11px] text-muted italic flex items-center gap-1.5">
            <Info className="size-3.5 text-info shrink-0" />
            <span>Staff permissions allow editing name, category, and storage location. Threshold and cost modifications require Admin role.</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="item-expiry"
            label="Expiry Date (Optional)"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <Input
            id="item-location"
            label="Storage Location (Optional)"
            placeholder="e.g. Walk-in Cooler"
            value={storageLocation}
            onChange={(e) => setStorageLocation(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <label className="text-xs font-bold text-foreground">Item Status:</label>
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="active"
                checked={status === "active"}
                onChange={() => setStatus("active")}
                className="text-primary"
              />
              Active
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={status === "inactive"}
                onChange={() => setStatus("inactive")}
                className="text-primary"
              />
              Inactive
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? t("save") : t("create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
