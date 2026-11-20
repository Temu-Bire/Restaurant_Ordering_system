import { useEffect, useState } from "react";

import PageHeader from "../../../shared/components/layout/PageHeader";
import Badge from "../../../shared/components/ui/Badge";
import Button from "../../../shared/components/ui/Button";
import Card from "../../../shared/components/ui/Card";
import Input from "../../../shared/components/ui/Input";
import { useAuth } from "../../auth/hooks/useAuth";
import { useLogout } from "../../auth/hooks/useLogout";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import * as usersApi from "../api/usersApi";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../addresses/api/addressesApi";
import type { DeliveryAddress, CreateAddressInput } from "../../addresses/types";
import AddressFormModal from "../../addresses/components/AddressFormModal";

export default function ProfilePage() {
  const { user, replaceUser } = useAuth();
  const { t } = useTranslation();
  const logout = useLogout();
  const [info, setInfo] = useState({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [infoMessage, setInfoMessage] = useState("");
  const [infoError, setInfoError] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Address management state
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<DeliveryAddress | null>(null);
  const [addressNotice, setAddressNotice] = useState("");

  useEffect(() => {
    let active = true;
    usersApi
      .getProfile()
      .then((profile) => {
        if (!active) return;
        setInfo({
          fullName: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
        });
        replaceUser(profile.user);
      })
      .catch(() => {
        /* keep session values */
      });

    if (user?.role === "customer") {
      setLoadingAddresses(true);
      listAddresses()
        .then((addrs) => {
          if (active) setAddresses(addrs);
        })
        .catch((err) => console.error("Failed to load addresses", err))
        .finally(() => {
          if (active) setLoadingAddresses(false);
        });
    }

    return () => {
      active = false;
    };
  }, [replaceUser, user?.role]);

  const setInfoField =
    (field: keyof typeof info) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setInfo((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSetDefaultAddress(id: string) {
    try {
      await setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
      setAddressNotice("Default address updated.");
      setTimeout(() => setAddressNotice(""), 3000);
    } catch (err: unknown) {
      console.error("Failed to set default address", err);
    }
  }

  async function handleDeleteAddress(id: string) {
    if (!window.confirm("Are you sure you want to delete this delivery address?")) return;
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setAddressNotice("Address deleted.");
      setTimeout(() => setAddressNotice(""), 3000);
    } catch (err: unknown) {
      console.error("Failed to delete address", err);
    }
  }

  return (
    <>
      <PageHeader
        title={t("navProfile")}
        description="Update your personal contact details, delivery addresses, and account security"
      />

      <div className="mb-5 flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center text-lg">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{user?.name}</h3>
            <p className="text-xs text-muted">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Role:</span>
          <Badge variant="active" className="uppercase font-bold tracking-wider text-xs">
            {user?.role}
          </Badge>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Personal info form */}
        <Card title="Personal Information" className="rounded-2xl shadow-xs">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setInfoError("");
              setInfoMessage("");
              if (!info.fullName.trim()) {
                setInfoError("Full name is required");
                return;
              }
              setSavingInfo(true);
              void usersApi
                .updateProfile({
                  name: info.fullName.trim(),
                  email: info.email.trim(),
                  phone: info.phone.trim(),
                  address: info.address.trim(),
                })
                .then((saved) => {
                  replaceUser(saved);
                  setInfoMessage("Profile updated successfully.");
                })
                .catch((error: unknown) => {
                  setInfoError(error instanceof Error ? error.message : "Could not save profile");
                })
                .finally(() => setSavingInfo(false));
            }}
          >
            <Input
              id="fullName"
              label="Full Name *"
              value={info.fullName}
              onChange={setInfoField("fullName")}
            />
            <Input
              id="email"
              label="Email Address *"
              type="email"
              value={info.email}
              onChange={setInfoField("email")}
            />
            <Input
              id="phone"
              label="Phone Number"
              type="tel"
              placeholder="+251 91 123 4567"
              value={info.phone}
              onChange={setInfoField("phone")}
            />
            <Input
              id="address"
              label="Default City / Area"
              placeholder="e.g. Bole, Addis Ababa"
              value={info.address}
              onChange={setInfoField("address")}
            />

            {infoMessage && (
              <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-semibold text-success">
                ✓ {infoMessage}
              </p>
            )}
            {infoError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs font-semibold text-danger">
                ⚠ {infoError}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="submit" disabled={savingInfo}>
                {savingInfo ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Change password form */}
        <Card title="Change Password" className="rounded-2xl shadow-xs">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setPasswordError("");
              setPasswordMessage("");

              if (!passwords.current) {
                setPasswordError("Please enter your current password");
                return;
              }
              if (passwords.next.length < 8) {
                setPasswordError("New password must be at least 8 characters");
                return;
              }
              if (passwords.next !== passwords.confirm) {
                setPasswordError("New password and confirm password do not match");
                return;
              }
              if (passwords.current === passwords.next) {
                setPasswordError("New password must be different from current password");
                return;
              }

              setSavingPassword(true);
              void usersApi
                .changePassword(passwords.current, passwords.next)
                .then(() => {
                  setPasswords({ current: "", next: "" , confirm: "" });
                  setPasswordMessage("Password updated successfully.");
                })
                .catch((error: unknown) => {
                  setPasswordError(
                    error instanceof Error ? error.message : "Could not update password"
                  );
                })
                .finally(() => setSavingPassword(false));
            }}
          >
            <Input
              id="current"
              label="Current Password *"
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            />
            <Input
              id="next"
              label="New Password (min 8 chars) *"
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
            />
            <Input
              id="confirm"
              label="Confirm New Password *"
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
            />

            {passwordMessage && (
              <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-semibold text-success">
                ✓ {passwordMessage}
              </p>
            )}
            {passwordError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs font-semibold text-danger">
                ⚠ {passwordError}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="submit" variant="outline" disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Update Password"}
              </Button>
              <Button type="button" variant="danger" onClick={logout}>
                Log out
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Customer Delivery Addresses Section */}
      {user?.role === "customer" && (
        <div className="mt-8">
          <Card
            title="Saved Delivery Addresses"
            description="Manage your map-pinned delivery locations for fast checkout"
            action={
              <Button
                size="sm"
                onClick={() => {
                  setAddressToEdit(null);
                  setAddressModalOpen(true);
                }}
              >
                + Add New Address
              </Button>
            }
            className="rounded-2xl shadow-xs"
          >
            {addressNotice && (
              <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-semibold text-success">
                ✓ {addressNotice}
              </div>
            )}

            {loadingAddresses ? (
              <p className="py-6 text-center text-xs text-muted">Loading delivery addresses...</p>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-muted mb-3">No delivery addresses saved yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAddressToEdit(null);
                    setAddressModalOpen(true);
                  }}
                >
                  📍 Pin Your First Location
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 text-xs shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold text-foreground mb-1">
                        <span className="capitalize flex items-center gap-1.5">
                          {addr.label === "home" ? "🏠" : addr.label === "work" ? "💼" : "📍"}{" "}
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                            Default
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-foreground">
                        {addr.recipientName} ({addr.phone})
                      </p>
                      <p className="text-muted mt-0.5">
                        {addr.building ? `${addr.building}, ` : ""}
                        {addr.street}, {addr.area}, {addr.city}
                      </p>
                      {addr.landmark && (
                        <p className="text-[11px] text-muted italic mt-0.5">
                          Near: {addr.landmark}
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-muted mt-1">
                        GPS: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted">Primary Address</span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAddressToEdit(addr);
                            setAddressModalOpen(true);
                          }}
                          className="font-bold text-foreground hover:text-primary"
                        >
                          Edit
                        </button>
                        <span className="text-muted">•</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="font-bold text-danger hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Address Form Modal */}
      <AddressFormModal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSaved={(saved) => {
          setAddresses((prev) => {
            const exists = prev.some((a) => a.id === saved.id);
            if (exists) {
              return prev.map((a) => (a.id === saved.id ? saved : a));
            }
            return [saved, ...prev];
          });
          setAddressNotice("Address saved successfully.");
          setTimeout(() => setAddressNotice(""), 3000);
        }}
        addressToEdit={addressToEdit}
        saveFn={async (data: CreateAddressInput) => {
          if (addressToEdit) {
            return updateAddress(addressToEdit.id, data);
          }
          return createAddress(data);
        }}
      />
    </>
  );
}
