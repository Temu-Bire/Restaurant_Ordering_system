import { useState } from "react";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Select from "../../../components/ui/Select";
import type { FoodItem } from "../../menu/types";
import type { Ingredient, RecipeLine } from "../types";

interface DraftLine {
  ingredientId: string;
  quantity: string;
}

interface RecipeFormProps {
  ingredients: Ingredient[];
  saved: RecipeLine[];
  onSave: (lines: RecipeLine[]) => void;
}

function RecipeForm({ ingredients, saved, onSave }: RecipeFormProps) {
  const [lines, setLines] = useState<DraftLine[]>(
    saved.map((l) => ({ ingredientId: l.ingredientId, quantity: String(l.quantity) }))
  );
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const unused = ingredients.filter(
    (i) => !lines.some((l) => l.ingredientId === i.id)
  );
  const nameOf = (id: string) => ingredients.find((i) => i.id === id)?.name ?? id;

  function save() {
    const parsed = lines.map((l) => ({
      ingredientId: l.ingredientId,
      quantity: Number(l.quantity),
    }));

    if (parsed.some((l) => Number.isNaN(l.quantity) || l.quantity <= 0)) {
      setStatus({ ok: false, text: "Quantities must be greater than 0" });
      return;
    }

    onSave(parsed);
    setStatus({ ok: true, text: "Recipe saved." });
  }

  return (
    <div className="mt-4">
      {lines.length === 0 && (
        <p className="mb-3 text-[13px] text-muted">No ingredients yet.</p>
      )}

      <ul className="space-y-2">
        {lines.map((line) => (
          <li key={line.ingredientId} className="flex items-center gap-3 text-[13px]">
            <span className="flex-1">{nameOf(line.ingredientId)}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              aria-label={`${nameOf(line.ingredientId)} quantity in kg`}
              value={line.quantity}
              onChange={(e) =>
                setLines((prev) =>
                  prev.map((l) =>
                    l.ingredientId === line.ingredientId
                      ? { ...l, quantity: e.target.value }
                      : l
                  )
                )
              }
              className="w-20 rounded-lg border border-border bg-surface-secondary px-2 py-1.5 outline-none focus:border-primary"
            />
            <span className="text-muted">kg</span>
            <button
              onClick={() =>
                setLines((prev) =>
                  prev.filter((l) => l.ingredientId !== line.ingredientId)
                )
              }
              aria-label={`Remove ${nameOf(line.ingredientId)}`}
              className="text-muted hover:text-danger"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {unused.length > 0 && (
        <div className="mt-3">
          <Select
            aria-label="Add ingredient"
            value=""
            options={[
              { value: "", label: "+ Add ingredient" },
              ...unused.map((i) => ({ value: i.id, label: i.name })),
            ]}
            onChange={(e) => {
              if (!e.target.value) return;
              setLines((prev) => [
                ...prev,
                { ingredientId: e.target.value, quantity: "0.1" },
              ]);
              setStatus(null);
            }}
          />
        </div>
      )}

      <Button className="mt-4" onClick={save}>
        Save Recipe
      </Button>

      {status && (
        <p className={`mt-2 text-xs ${status.ok ? "text-success" : "text-danger"}`}>
          {status.text}
        </p>
      )}
    </div>
  );
}

interface RecipeEditorProps {
  foods: FoodItem[];
  ingredients: Ingredient[];
  initialRecipes: Record<string, RecipeLine[]>;
}

export default function RecipeEditor({
  foods,
  ingredients,
  initialRecipes,
}: RecipeEditorProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [foodId, setFoodId] = useState(foods[0]?.id ?? "");

  return (
    <Card title="Recipe Quantities">
      <Select
        id="recipe-food"
        aria-label="Dish"
        value={foodId}
        options={foods.map((f) => ({ value: f.id, label: f.name }))}
        onChange={(e) => setFoodId(e.target.value)}
      />

      <RecipeForm
        key={foodId}
        ingredients={ingredients}
        saved={recipes[foodId] ?? []}
        onSave={(lines) => setRecipes((prev) => ({ ...prev, [foodId]: lines }))}
      />

      <p className="mt-4 text-xs text-muted">
        Stock is deducted automatically per order; alerts fire below minimum.
      </p>
    </Card>
  );
}