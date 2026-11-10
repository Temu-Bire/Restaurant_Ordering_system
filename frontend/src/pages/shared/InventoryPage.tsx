import { useState } from "react";

import PageHeader from "../../components/layout/PageHeader";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DataTable, { type Column } from "../../components/ui/DataTable";
import RecipeEditor from "../../features/inventory/components/RecipeEditor";
import StockBar from "../../features/inventory/components/StockBar";
import StockModal from "../../features/inventory/components/StockModal";
import { isLow, type Ingredient } from "../../features/inventory/types";
import { ingredients, recipes } from "../../mocks/inventory";
import { menuItems } from "../../mocks/menu";

export default function InventoryPage({ role }: { role: "staff" | "admin" }) {
  const [items, setItems] = useState<Ingredient[]>(ingredients);
  const [modalId, setModalId] = useState<string | null>(null);

  const low = items.filter(isLow);

  // TEMP: local update. Later this calls inventoryApi.updateStock()
  const saveStock = (id: string, stock: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stock } : i)));

  const columns: Column<Ingredient>[] = [
    { header: "Ingredient", cell: (i) => i.name },
    { header: "In Stock", cell: (i) => `${i.stock} kg` },
    { header: "Minimum", cell: (i) => `${i.minimum} kg` },
    { header: "Level", className: "w-40", cell: (i) => <StockBar ingredient={i} /> },
    {
      header: "Status",
      cell: (i) => (
        <Badge variant={isLow(i) ? "low" : "ok"}>{isLow(i) ? "Low" : "OK"}</Badge>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (i) => (
        <button
          onClick={() => setModalId(i.id)}
          className="font-semibold text-primary"
        >
          Update
        </button>
      ),
    },
  ];

  const table = (
    <Card>
      <DataTable columns={columns} data={items} getRowKey={(i) => i.id} />
    </Card>
  );

  return (
    <>
      <PageHeader
        title={role === "admin" ? "Inventory & Recipes" : "Inventory"}
        description={
          role === "admin"
            ? "Stock levels, minimums and recipe quantities"
            : "Record ingredient stock levels"
        }
      />

      <div className="mb-4 flex items-center gap-3">
        {low.length > 0 ? (
          <div
            role="alert"
            className="flex-1 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger"
          >
            <strong>
              ⚠ {low.length} {low.length === 1 ? "item" : "items"} below minimum stock
            </strong>{" "}
            — {low.map((i) => i.name).join(", ")}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <Button onClick={() => setModalId(items[0]?.id ?? null)}>
          + Record Stock
        </Button>
      </div>

      {role === "admin" ? (
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
          {table}
          <RecipeEditor
            foods={menuItems}
            ingredients={items}
            initialRecipes={recipes}
          />
        </div>
      ) : (
        table
      )}

      {modalId && (
        <StockModal
          key={modalId}
          ingredients={items}
          initialId={modalId}
          onClose={() => setModalId(null)}
          onSave={saveStock}
        />
      )}
    </>
  );
}