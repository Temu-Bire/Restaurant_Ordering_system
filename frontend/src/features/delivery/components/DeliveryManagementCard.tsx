import { useEffect, useState } from "react";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import Input from "../../../shared/components/ui/Input";
import Modal from "../../../shared/components/ui/Modal";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import {
  getDeliveryConfig,
  updateDeliveryConfig,
  getDeliveryTiers,
  createDeliveryTier,
  updateDeliveryTier,
  deleteDeliveryTier,
} from "../api/deliveryApi";
import type { DeliveryConfig, DeliveryTier } from "../types";

export default function DeliveryManagementCard() {
  const [, setConfig] = useState<DeliveryConfig | null>(null);
  const [tiers, setTiers] = useState<DeliveryTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configNotice, setConfigNotice] = useState("");
  const [configError, setConfigError] = useState("");

  // Form states for config
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [restaurantAddress, setRestaurantAddress] = useState("Bole, Addis Ababa");
  const [restaurantLat, setRestaurantLat] = useState("9.0054");
  const [restaurantLng, setRestaurantLng] = useState("38.7636");
  const [maxDistanceKm, setMaxDistanceKm] = useState("15");
  const [minOrderAmount, setMinOrderAmount] = useState("0");

  // Tier modal
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<DeliveryTier | null>(null);
  const [tierMin, setTierMin] = useState("0");
  const [tierMax, setTierMax] = useState("1");
  const [tierFee, setTierFee] = useState("30");
  const [tierError, setTierError] = useState("");
  const [savingTier, setSavingTier] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [cfg, tierList] = await Promise.all([getDeliveryConfig(), getDeliveryTiers()]);
      setConfig(cfg);
      setTiers(tierList);
      setDeliveryEnabled(cfg.deliveryEnabled);
      setRestaurantAddress(cfg.restaurantAddress);
      setRestaurantLat(String(cfg.restaurantLat));
      setRestaurantLng(String(cfg.restaurantLng));
      setMaxDistanceKm(String(cfg.maxDeliveryDistanceKm));
      setMinOrderAmount(String(cfg.minDeliveryOrderAmount));
    } catch (err) {
      console.error("Failed to load delivery settings", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    setConfigNotice("");
    setConfigError("");

    const lat = Number(restaurantLat);
    const lng = Number(restaurantLng);
    const maxDist = Number(maxDistanceKm);
    const minOrder = Number(minOrderAmount);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setConfigError("Invalid coordinates");
      setSavingConfig(false);
      return;
    }
    if (Number.isNaN(maxDist) || maxDist <= 0) {
      setConfigError("Maximum distance must be greater than 0 km");
      setSavingConfig(false);
      return;
    }

    try {
      const updated = await updateDeliveryConfig({
        deliveryEnabled,
        restaurantAddress,
        restaurantLat: lat,
        restaurantLng: lng,
        maxDeliveryDistanceKm: maxDist,
        minDeliveryOrderAmount: minOrder,
      });
      setConfig(updated);
      setConfigNotice("Delivery settings saved.");
      setTimeout(() => setConfigNotice(""), 3000);
    } catch (err: unknown) {
      setConfigError(err instanceof Error ? err.message : "Failed to update delivery settings");
    } finally {
      setSavingConfig(false);
    }
  }

  function openAddTier() {
    setEditingTier(null);
    const lastTier = tiers[tiers.length - 1];
    const nextMin = lastTier ? lastTier.maxDistance : 0;
    setTierMin(String(nextMin));
    setTierMax(String(nextMin + 1));
    setTierFee("50");
    setTierError("");
    setTierModalOpen(true);
  }

  function openEditTier(tier: DeliveryTier) {
    setEditingTier(tier);
    setTierMin(String(tier.minDistance));
    setTierMax(String(tier.maxDistance));
    setTierFee(String(tier.fee));
    setTierError("");
    setTierModalOpen(true);
  }

  async function handleSaveTier(e: React.FormEvent) {
    e.preventDefault();
    setTierError("");

    const min = Number(tierMin);
    const max = Number(tierMax);
    const fee = Number(tierFee);

    if (Number.isNaN(min) || Number.isNaN(max) || min >= max || min < 0) {
      setTierError("Min distance must be non-negative and less than max distance");
      return;
    }
    if (Number.isNaN(fee) || fee < 0) {
      setTierError("Fee must be 0 or more");
      return;
    }

    setSavingTier(true);
    try {
      if (editingTier) {
        const updated = await updateDeliveryTier(editingTier.id, {
          minDistance: min,
          maxDistance: max,
          fee,
        });
        setTiers((prev) =>
          prev.map((t) => (t.id === editingTier.id ? updated : t)).sort((a, b) => a.minDistance - b.minDistance)
        );
      } else {
        const created = await createDeliveryTier({
          minDistance: min,
          maxDistance: max,
          fee,
        });
        setTiers((prev) => [...prev, created].sort((a, b) => a.minDistance - b.minDistance));
      }
      setTierModalOpen(false);
    } catch (err: unknown) {
      setTierError(err instanceof Error ? err.message : "Failed to save delivery tier");
    } finally {
      setSavingTier(false);
    }
  }

  async function handleDeleteTier(id: string) {
    if (!window.confirm("Are you sure you want to delete this delivery tier?")) return;
    try {
      await deleteDeliveryTier(id);
      setTiers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete tier", err);
    }
  }

  if (loading) {
    return (
      <Card title="Delivery & Boundary Management" className="rounded-2xl shadow-xs py-8 text-center text-xs text-muted">
        Loading delivery configuration...
      </Card>
    );
  }

  return (
    <Card
      title="Delivery & Boundary Management"
      description="Configure restaurant coordinates, service radius, and distance-based pricing tiers"
      className="rounded-2xl shadow-xs"
    >
      <form onSubmit={handleSaveConfig} className="space-y-4">
        {configNotice && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-semibold text-success">
            ✓ {configNotice}
          </div>
        )}
        {configError && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs font-semibold text-danger">
            ⚠ {configError}
          </div>
        )}

        {/* Toggle Delivery Enabled */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary/40 p-3">
          <div>
            <span className="text-xs font-bold text-foreground block">
              Enable Restaurant Delivery
            </span>
            <span className="text-[11px] text-muted">
              When disabled, customers will see delivery as unavailable at checkout
            </span>
          </div>
          <input
            type="checkbox"
            checked={deliveryEnabled}
            onChange={(e) => setDeliveryEnabled(e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
        </div>

        <Input
          id="rest-address-del"
          label="Restaurant Pickup Address"
          value={restaurantAddress}
          onChange={(e) => setRestaurantAddress(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="rest-lat"
            label="Restaurant Latitude *"
            type="number"
            step="0.000001"
            value={restaurantLat}
            onChange={(e) => setRestaurantLat(e.target.value)}
          />
          <Input
            id="rest-lng"
            label="Restaurant Longitude *"
            type="number"
            step="0.000001"
            value={restaurantLng}
            onChange={(e) => setRestaurantLng(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="max-distance"
            label="Max Delivery Boundary (km) *"
            type="number"
            step="0.5"
            min="0.5"
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(e.target.value)}
          />
          <Input
            id="min-order"
            label="Minimum Delivery Order Amount (ETB)"
            type="number"
            min="0"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
          />
        </div>

        <div className="pt-1">
          <Button type="submit" disabled={savingConfig}>
            {savingConfig ? "Saving..." : "Save Delivery Configuration"}
          </Button>
        </div>
      </form>

      {/* Distance Pricing Tiers Table */}
      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Distance-Based Delivery Tiers
            </h4>
            <p className="text-[11px] text-muted">Fees applied according to customer distance</p>
          </div>
          <Button size="sm" onClick={openAddTier}>
            + Add Fee Tier
          </Button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/60 text-muted font-bold border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Distance Range</th>
                <th className="py-2.5 px-3">Fee Amount</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tiers.map((t) => (
                <tr key={t.id} className="hover:bg-surface-secondary/30">
                  <td className="py-2.5 px-3 font-semibold text-foreground">
                    {t.minDistance} km – {t.maxDistance} km
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-primary">
                    {formatCurrency(t.fee)}
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditTier(t)}
                      className="font-bold text-foreground hover:text-primary"
                    >
                      Edit
                    </button>
                    <span className="text-muted">•</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTier(t.id)}
                      className="font-bold text-danger hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tiers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-muted">
                    No distance fee tiers configured. Click "+ Add Fee Tier".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier Modal */}
      {tierModalOpen && (
        <Modal
          open
          onClose={() => setTierModalOpen(false)}
          title={editingTier ? "Edit Distance Fee Tier" : "Add Distance Fee Tier"}
        >
          <form onSubmit={handleSaveTier} className="space-y-4">
            {tierError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs font-semibold text-danger">
                ⚠ {tierError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                id="t-min"
                label="Min Distance (km) *"
                type="number"
                step="0.1"
                min="0"
                value={tierMin}
                onChange={(e) => setTierMin(e.target.value)}
              />
              <Input
                id="t-max"
                label="Max Distance (km) *"
                type="number"
                step="0.1"
                min="0.1"
                value={tierMax}
                onChange={(e) => setTierMax(e.target.value)}
              />
            </div>

            <Input
              id="t-fee"
              label="Delivery Fee (ETB) *"
              type="number"
              min="0"
              value={tierFee}
              onChange={(e) => setTierFee(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setTierModalOpen(false)}
                disabled={savingTier}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingTier}>
                {savingTier ? "Saving..." : editingTier ? "Update Tier" : "Create Tier"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
}
