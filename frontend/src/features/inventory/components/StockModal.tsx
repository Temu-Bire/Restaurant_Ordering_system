import { useState, type FormEvent } from "react";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import type { Ingredient } from "../types";

interface StockModalProps {
  ingredients: Ingredient[];
  initialId: string;
  onClose: () => void;
  onSave: (id: string, stock: number) => void;
}

export default function StockModal({
  ingredients,
  initialId,
  onClose,
  onSave,
}: StockModalProps) {
  const stockOf = (id: string) =>
    String(ingredients.find((i) => i.id === id)?.stock ?? 0);

  const [id, setId] = useState(initialId);
  const [stock, setStock] = useState(stockOf(initialId));
  const [error, setError] = useState("");

  function changeIngredient(newId: string) {
    setId(newId);
    setStock(stockOf(newId));
    setError("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = Number(stock);

    if (stock.trim() === "" || Number.isNaN(value) || value < 0) {
      setError("Enter a stock level of 0 or more");
      return;
    }

    onSave(id, value);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Record Stock">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Select
          id="ingredient"
          label="Ingredient"
          value={id}
          options={ingredients.map((i) => ({ value: i.id, label: i.name }))}
          onChange={(e) => changeIngredient(e.target.value)}
        />

        <Input
          id="stock"
          label="In stock (kg)"
          type="number"
          step="0.01"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          error={error}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}