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
    return () => {
      active = false;
    };
  }, [replaceUser]);

  const setInfoField =
    (field: keyof typeof info) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setInfo((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <>
      <PageHeader
        title={t("navProfile")}
        description="Update your personal contact details and account security"
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
              label="Delivery / Contact Address"
              placeholder="e.g. Bole Subcity, Addis Ababa"
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
    </>
  );
}
