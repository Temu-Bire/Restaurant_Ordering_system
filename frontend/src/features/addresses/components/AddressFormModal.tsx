import { useEffect, useState } from "react";
import { Crosshair, UtensilsCrossed, MapPin, AlertTriangle } from "lucide-react";
import Button from "../../../shared/components/ui/Button";
import Input from "../../../shared/components/ui/Input";
import Modal from "../../../shared/components/ui/Modal";
import Select from "../../../shared/components/ui/Select";
import type { AddressLabel, CreateAddressInput, DeliveryAddress } from "../types";

interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (address: DeliveryAddress) => void;
  addressToEdit?: DeliveryAddress | null;
  saveFn: (data: CreateAddressInput) => Promise<DeliveryAddress>;
}

export default function AddressFormModal({
  open,
  onClose,
  onSaved,
  addressToEdit,
  saveFn,
}: AddressFormModalProps) {
  const [label, setLabel] = useState<AddressLabel>("home");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Addis Ababa");
  const [area, setArea] = useState("Bole");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [building, setBuilding] = useState("");
  const [apartment, setApartment] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [latitude, setLatitude] = useState(9.0054);
  const [longitude, setLongitude] = useState(38.7636);
  const [isDefault, setIsDefault] = useState(false);

  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (addressToEdit) {
      setLabel(addressToEdit.label);
      setRecipientName(addressToEdit.recipientName);
      setPhone(addressToEdit.phone);
      setCity(addressToEdit.city);
      setArea(addressToEdit.area);
      setStreet(addressToEdit.street);
      setLandmark(addressToEdit.landmark ?? "");
      setBuilding(addressToEdit.building ?? "");
      setApartment(addressToEdit.apartment ?? "");
      setDeliveryInstructions(addressToEdit.deliveryInstructions ?? "");
      setLatitude(addressToEdit.latitude);
      setLongitude(addressToEdit.longitude);
      setIsDefault(addressToEdit.isDefault);
    } else {
      setLabel("home");
      setRecipientName("");
      setPhone("");
      setCity("Addis Ababa");
      setArea("Bole");
      setStreet("");
      setLandmark("");
      setBuilding("");
      setApartment("");
      setDeliveryInstructions("");
      setLatitude(9.0054);
      setLongitude(38.7636);
      setIsDefault(false);
    }
    setError("");
  }, [addressToEdit, open]);

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Math.round(pos.coords.latitude * 10000) / 10000);
        setLongitude(Math.round(pos.coords.longitude * 10000) / 10000);
        setLocating(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        setError("Could not get current GPS coordinates. You can select or enter them on the map.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  // Interactive map coordinate picker on click
  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1

    const minLat = 8.92;
    const maxLat = 9.08;
    const minLng = 38.68;
    const maxLng = 38.86;

    const newLat = maxLat - y * (maxLat - minLat);
    const newLng = minLng + x * (maxLng - minLng);

    setLatitude(Math.round(newLat * 10000) / 10000);
    setLongitude(Math.round(newLng * 10000) / 10000);
  }

  // Calculate pin position on map (0-100%)
  const minLat = 8.92;
  const maxLat = 9.08;
  const minLng = 38.68;
  const maxLng = 38.86;

  const pinX = Math.min(100, Math.max(0, ((longitude - minLng) / (maxLng - minLng)) * 100));
  const pinY = Math.min(100, Math.max(0, ((maxLat - latitude) / (maxLat - minLat)) * 100));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!recipientName.trim()) {
      setError("Recipient name is required");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (!street.trim()) {
      setError("Street name is required");
      return;
    }
    if (!area.trim()) {
      setError("Area is required");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveFn({
        label,
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        area: area.trim(),
        street: street.trim(),
        landmark: landmark.trim() || undefined,
        building: building.trim() || undefined,
        apartment: apartment.trim() || undefined,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        latitude,
        longitude,
        isDefault,
      });
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={addressToEdit ? "Edit Delivery Address" : "Add New Delivery Address"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-500 flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Map Pin Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground">
              Select Location on Map
            </label>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1.5"
            >
              <Crosshair className="size-3.5" />
              <span>{locating ? "Locating..." : "Use Current GPS"}</span>
            </button>
          </div>

          <div
            onClick={handleMapClick}
            className="relative h-44 w-full cursor-crosshair rounded-xl border border-border bg-slate-100 dark:bg-slate-900 overflow-hidden select-none shadow-inner"
            title="Click anywhere to reposition the delivery pin"
          >
            {/* Styled Map Background Grid */}
            <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <span className="text-4xl font-black tracking-widest text-foreground">ADDIS ABABA</span>
            </div>

            {/* Neighborhood markers */}
            <span className="absolute top-4 left-6 text-[10px] font-bold text-muted pointer-events-none">Piazza</span>
            <span className="absolute top-1/2 left-1/3 text-[10px] font-bold text-muted pointer-events-none">Kazanchis</span>
            <span className="absolute bottom-6 right-8 text-[10px] font-bold text-muted pointer-events-none">Bole Medhanialem</span>
            <span className="absolute bottom-10 left-8 text-[10px] font-bold text-muted pointer-events-none">Sarbet</span>

            {/* Restaurant Central Pin */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${((38.7636 - minLng) / (maxLng - minLng)) * 100}%`,
                top: `${((maxLat - 9.0054) / (maxLat - minLat)) * 100}%`,
              }}
            >
              <div className="flex flex-col items-center">
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs inline-flex items-center gap-1">
                  <UtensilsCrossed className="size-2.5" />
                  <span>Restaurant</span>
                </span>
              </div>
            </div>

            {/* Customer Pin */}
            <div
              className="absolute -translate-x-1/2 -translate-y-full transition-all duration-150 pointer-events-none z-10"
              style={{ left: `${pinX}%`, top: `${pinY}%` }}
            >
              <div className="flex flex-col items-center animate-bounce">
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-md">
                  Delivery Pin
                </span>
                <MapPin className="size-6 text-rose-600 drop-shadow" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted font-mono bg-surface-secondary/40 px-2.5 py-1.5 rounded-lg border border-border">
            <span>Lat: {latitude.toFixed(4)}</span>
            <span>Lng: {longitude.toFixed(4)}</span>
            <span className="text-[10px] text-primary">Pin click supported</span>
          </div>
        </div>

        {/* Address details */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            id="address-label"
            label="Address Label"
            value={label}
            options={[
              { value: "home", label: "Home" },
              { value: "work", label: "Work" },
              { value: "other", label: "Other" },
            ]}
            onChange={(e) => setLabel(e.target.value as AddressLabel)}
          />
          <Input
            id="recipientName"
            label="Recipient Name *"
            placeholder="e.g. Abebe Kebede"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="phone"
            label="Contact Phone *"
            placeholder="+251 9..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            id="city"
            label="City *"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="area"
            label="Area *"
            placeholder="e.g. Bole"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
          <Input
            id="street"
            label="Street *"
            placeholder="e.g. Airport Road"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Input
            id="landmark"
            label="Nearby Landmark"
            placeholder="e.g. Medhanialem Church"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
          />
          <Input
            id="building"
            label="Building Name"
            placeholder="e.g. Abyssinia Plaza"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
          />
          <Input
            id="apartment"
            label="Apartment or Floor"
            placeholder="e.g. Floor 3"
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
          />
        </div>

        <Input
          id="deliveryInstructions"
          label="Delivery Instructions"
          placeholder="e.g. Call upon arrival"
          value={deliveryInstructions}
          onChange={(e) => setDeliveryInstructions(e.target.value)}
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="isDefault" className="text-xs font-semibold text-foreground cursor-pointer">
            Set as default delivery address
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : addressToEdit ? "Update Address" : "Save Address"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
