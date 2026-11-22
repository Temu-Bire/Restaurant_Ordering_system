import { useState, useEffect } from "react";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Coins,
  Tag,
  History,
  ChefHat,
  Plus,
  Trash,
  SlidersHorizontal,
  ClipboardCheck,
  Pencil,
  Pause,
  Play,
  Trash2,
  MapPin,
  AlertCircle,
} from "lucide-react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import FilterTabs from "../../../shared/components/ui/FilterTabs";
import Select from "../../../shared/components/ui/Select";
import StatCard from "../../../shared/components/ui/StatCard";
import RecipeEditor from "../components/RecipeEditor";
import StockBar from "../components/StockBar";
import ItemFormModal from "../components/ItemFormModal";
import StockActionModal, { type StockActionMode } from "../components/StockActionModal";
import StockMovementHistoryModal from "../components/StockMovementHistoryModal";
import {
  INVENTORY_CATEGORY_LABEL,
  type CreateInventoryItemInput,
  type Ingredient,
  type RecipeLine,
  type StockStatus,
} from "../types";
import {
  listIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  toggleIngredientStatus,
  receiveStock,
  recordWaste,
  stockCount,
  manualAdjustment,
  listRecipes,
  saveRecipe,
} from "../api/inventoryApi";
import { listFoods } from "../../menu/api/menuApi";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { FoodItem } from "../../menu/types";

type StockFilter = "all" | StockStatus;

export default function InventoryPage({ role }: { role: "staff" | "admin" }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Record<string, RecipeLine[]>>({});
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  // Modals state
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [actionItem, setActionItem] = useState<{ item: Ingredient; mode: StockActionMode } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedIngredientForHistory, setSelectedIngredientForHistory] = useState<string | undefined>(undefined);
  const [showRecipeEditor, setShowRecipeEditor] = useState(false);

  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  const isAdmin = role === "admin";

  async function loadData() {
    setLoading(true);
    try {
      const [ingList, recList] = await Promise.all([listIngredients(), listRecipes()]);
      setItems(ingList);
      setRecipes(recList);

      if (isAdmin) {
        const apifoods = await listFoods();
        setFoods(
          apifoods.map((f) => ({
            id: f.id,
            name: f.name,
            price: f.price,
            category: f.category.name.toLowerCase(),
            description: f.description,
            gradient: "from-orange-400 to-orange-600",
            available: f.isAvailable,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load inventory data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [role]);

  // Derived stock counts
  const inStockCount = items.filter((i) => i.stockStatus === "in_stock").length;
  const lowStockCount = items.filter((i) => i.stockStatus === "low_stock").length;
  const outOfStockCount = items.filter((i) => i.stockStatus === "out_of_stock").length;
  const totalValue = items.reduce((sum, i) => sum + i.stock * i.unitCost, 0);

  // Filtered items
  const q = search.trim().toLowerCase();
  const visible = items.filter((i) => {
    const matchesSearch =
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q) ||
      (i.storageLocation ?? "").toLowerCase().includes(q);

    const matchesCategory = categoryFilter === "all" || i.category === categoryFilter;
    const matchesStock = stockFilter === "all" || i.stockStatus === stockFilter;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Handlers for Add/Edit
  async function handleSaveItem(data: CreateInventoryItemInput) {
    if (editingItem) {
      const updated = await updateIngredient(editingItem.id, data);
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
      setNotice(`Updated ${updated.name}`);
    } else {
      const created = await createIngredient(data);
      setItems((prev) => [created, ...prev]);
      setNotice(`Created inventory item ${created.name}`);
    }
    setTimeout(() => setNotice(""), 3000);
  }

  async function handleDelete(item: Ingredient) {
    if (!window.confirm(`Delete ${item.name}? This will remove it from inventory.`)) return;
    try {
      await deleteIngredient(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setNotice(`Deleted ${item.name}`);
      setTimeout(() => setNotice(""), 3000);
    } catch (err: unknown) {
      setErrorNotice(err instanceof Error ? err.message : "Failed to delete item");
      setTimeout(() => setErrorNotice(""), 4000);
    }
  }

  async function handleToggleStatus(item: Ingredient) {
    try {
      const updated = await toggleIngredientStatus(item.id);
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      setNotice(`${item.name} is now ${updated.status}`);
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveRecipe(foodId: string, lines: RecipeLine[]) {
    try {
      await saveRecipe(foodId, lines);
      setRecipes((prev) => ({ ...prev, [foodId]: lines }));
      setNotice("Recipe saved successfully");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      console.error(err);
    }
  }

  // Stock action helpers
  async function handleReceive(id: string, data: { quantity: number; costPerUnit?: number; notes?: string }) {
    const updated = await receiveStock(id, data);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setNotice(`Received ${data.quantity} ${updated.unit} of ${updated.name}`);
    setTimeout(() => setNotice(""), 3000);
  }

  async function handleWaste(id: string, data: { quantity: number; reason: string; notes?: string }) {
    const updated = await recordWaste(id, data);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setNotice(`Recorded waste for ${updated.name}`);
    setTimeout(() => setNotice(""), 3000);
  }

  async function handleCount(id: string, data: { countedStock: number; notes?: string }) {
    const updated = await stockCount(id, data);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setNotice(`Stock count updated for ${updated.name}`);
    setTimeout(() => setNotice(""), 3000);
  }

  async function handleAdjust(id: string, data: { newStock: number; reason: string }) {
    const updated = await manualAdjustment(id, data);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setNotice(`Stock adjusted for ${updated.name}`);
    setTimeout(() => setNotice(""), 3000);
  }

  return (
    <>
      <PageHeader
        title={t("navInventory")}
        description={
          isAdmin
            ? "Manage restaurant food supplies, recipes, stock audits, and movement logs"
            : "Monitor kitchen inventory, record receiving, waste, and stock counting"
        }
      />

      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {errorNotice && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-danger">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Stock Alerts Notice */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-semibold text-amber-700 dark:text-amber-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">
                {outOfStockCount > 0 && `${outOfStockCount} items OUT OF STOCK. `}
                {lowStockCount > 0 && `${lowStockCount} items LOW ON STOCK.`}
              </p>
              <p className="text-[11px] opacity-80">
                Replenish inventory to prevent dishes from becoming unavailable on the customer menu.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStockFilter("low_stock")}
            className="text-xs border-amber-500/40 hover:bg-amber-500/20"
          >
            Filter Low & Out of Stock →
          </Button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-5">
        <StatCard label="Total Items" value={items.length} tone="purple" icon={<Package className="size-5" />} />
        <StatCard label="In Stock" value={inStockCount} tone="success" icon={<CheckCircle2 className="size-5" />} />
        <StatCard label="Low Stock" value={lowStockCount} tone="primary" icon={<AlertTriangle className="size-5" />} />
        <StatCard label="Out of Stock" value={outOfStockCount} tone="danger" icon={<XCircle className="size-5" />} />
        {isAdmin ? (
          <StatCard
            label="Total Valuation"
            value={formatCurrency(totalValue)}
            tone="info"
            icon={<Coins className="size-5" />}
          />
        ) : (
          <StatCard label="Active Items" value={items.filter((i) => i.status === "active").length} tone="info" icon={<Tag className="size-5" />} />
        )}
      </div>

      {/* Controls Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <input
            type="text"
            placeholder="Search items, SKU, or storage location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-primary shadow-xs"
          />

          <div className="w-40">
            <Select
              id="cat-select"
              value={categoryFilter}
              options={[
                { value: "all", label: "All Categories" },
                { value: "ingredients", label: "Ingredients" },
                { value: "beverages", label: "Beverages" },
                { value: "dry_goods", label: "Dry Goods" },
                { value: "packaging", label: "Packaging" },
                { value: "supplies", label: "Supplies" },
              ]}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedIngredientForHistory(undefined);
              setHistoryOpen(true);
            }}
            className="inline-flex items-center gap-1.5"
          >
            <History className="size-4" />
            <span>Movement History</span>
          </Button>

          {isAdmin && (
            <>
              <Button
                variant={showRecipeEditor ? "outline" : "secondary"}
                size="sm"
                onClick={() => setShowRecipeEditor(!showRecipeEditor)}
                className="inline-flex items-center gap-1.5"
              >
                <ChefHat className="size-4" />
                <span>{showRecipeEditor ? "Hide Recipes" : "Recipe Editor"}</span>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setItemFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5"
              >
                <Plus className="size-4" />
                <span>Add Item</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stock Filter Tabs */}
      <div className="mb-4 overflow-x-auto pb-1">
        <FilterTabs
          value={stockFilter}
          onChange={(val) => setStockFilter(val as StockFilter)}
          tabs={[
            { value: "all", label: "All Stock" },
            { value: "in_stock", label: "In Stock" },
            { value: "low_stock", label: "Low Stock", count: lowStockCount },
            { value: "out_of_stock", label: "Out of Stock", count: outOfStockCount },
          ]}
        />
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {showRecipeEditor && isAdmin && (
          <Card title="Menu Recipe & Automatic Consumption Mapping" className="rounded-2xl shadow-xs">
            <RecipeEditor
              foods={foods}
              ingredients={items}
              initialRecipes={recipes}
              onSave={handleSaveRecipe}
            />
          </Card>
        )}

        {/* Inventory Items Table */}
        <Card className="rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/60 text-muted font-bold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Item & Code</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Stock Level</th>
                  <th className="py-3 px-3">Min. Threshold</th>
                  {isAdmin && <th className="py-3 px-3">Unit Cost</th>}
                  <th className="py-3 px-3">Location / Expiry</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-muted">
                      Loading inventory items...
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-muted">
                      No inventory items match your search.
                    </td>
                  </tr>
                ) : (
                  visible.map((item) => {
                    const statusBadgeVariant =
                      item.stockStatus === "in_stock"
                        ? "ok"
                        : item.stockStatus === "low_stock"
                        ? "low"
                        : "failed";

                    const statusBadgeLabel =
                      item.stockStatus === "in_stock"
                        ? "In Stock"
                        : item.stockStatus === "low_stock"
                        ? "Low Stock"
                        : "Out of Stock";

                    return (
                      <tr key={item.id} className="hover:bg-surface-secondary/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-foreground text-sm">{item.name}</p>
                          <span className="font-mono text-[10px] text-muted">
                            SKU: {item.sku}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="rounded-lg bg-surface-secondary px-2 py-0.5 text-[11px] font-semibold text-muted">
                            {INVENTORY_CATEGORY_LABEL[item.category] ?? item.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <span className="font-bold text-foreground font-mono">
                              {item.stock} {item.unit}
                            </span>
                            <div className="w-24">
                              <StockBar ingredient={item} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-muted font-mono">
                          {item.minimum} {item.unit}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-3 font-mono font-bold text-foreground">
                            {formatCurrency(item.unitCost)}
                          </td>
                        )}
                        <td className="py-3 px-3 text-muted">
                          {item.storageLocation ? (
                            <span className="truncate max-w-[120px] text-foreground font-medium inline-flex items-center gap-1">
                              <MapPin className="size-3 shrink-0 text-muted" />
                              <span>{item.storageLocation}</span>
                            </span>
                          ) : (
                            <span className="text-[11px]">—</span>
                          )}
                          {item.expiryDate && (
                            <span className="block text-[10px]">
                              Exp: {new Date(item.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={statusBadgeVariant} className="font-bold text-[10px] uppercase">
                            {statusBadgeLabel}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Stock operational buttons */}
                            <button
                              type="button"
                              title="Receive Stock"
                              onClick={() => setActionItem({ item, mode: "receive" })}
                              className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 px-2 py-1 text-[11px] font-bold transition-colors"
                            >
                              <Plus className="size-3" />
                              <span>Receive</span>
                            </button>
                            <button
                              type="button"
                              title="Record Waste"
                              onClick={() => setActionItem({ item, mode: "waste" })}
                              className="inline-flex items-center gap-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 px-2 py-1 text-[11px] font-bold transition-colors"
                            >
                              <Trash className="size-3" />
                              <span>Waste</span>
                            </button>
                            <button
                              type="button"
                              title="Stock Count"
                              onClick={() => setActionItem({ item, mode: "count" })}
                              className="inline-flex items-center gap-0.5 rounded-lg bg-surface-secondary text-foreground hover:bg-surface-secondary/80 px-2 py-1 text-[11px] font-bold border border-border transition-colors"
                            >
                              <ClipboardCheck className="size-3" />
                              <span>Count</span>
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                title="Manual Adjustment"
                                onClick={() => setActionItem({ item, mode: "adjust" })}
                                className="inline-flex items-center gap-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 px-2 py-1 text-[11px] font-bold transition-colors"
                              >
                                <SlidersHorizontal className="size-3" />
                                <span>Adjust</span>
                              </button>
                            )}
                            <button
                              type="button"
                              title="Edit item"
                              onClick={() => {
                                setEditingItem(item);
                                setItemFormOpen(true);
                              }}
                              className="text-muted hover:text-foreground font-semibold px-1 transition-colors"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  title={item.status === "active" ? "Disable item" : "Enable item"}
                                  onClick={() => handleToggleStatus(item)}
                                  className="text-muted hover:text-foreground text-xs px-1 transition-colors"
                                >
                                  {item.status === "active" ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  title="Delete item"
                                  onClick={() => handleDelete(item)}
                                  className="text-danger hover:opacity-80 px-1 font-bold transition-colors"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Item Add/Edit Modal */}
      {itemFormOpen && (
        <ItemFormModal
          open
          itemToEdit={editingItem}
          role={role}
          onClose={() => {
            setItemFormOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
        />
      )}

      {/* Stock Action Modal (Receive, Waste, Count, Adjust) */}
      {actionItem && (
        <StockActionModal
          open
          item={actionItem.item}
          mode={actionItem.mode}
          onClose={() => setActionItem(null)}
          onReceive={handleReceive}
          onWaste={handleWaste}
          onCount={handleCount}
          onAdjust={handleAdjust}
        />
      )}

      {/* Movement History Audit Log Modal */}
      <StockMovementHistoryModal
        open={historyOpen}
        ingredientId={selectedIngredientForHistory}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}
