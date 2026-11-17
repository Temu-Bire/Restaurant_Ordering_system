import { useEffect, useState } from "react";

import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { useAuth } from "../../features/auth/useAuth";
import { useLogout } from "../../features/auth/useLogout";
import * as usersApi from "../../features/users/usersApi";

export default function ProfilePage() {
  const { user, replaceUser } = useAuth();
  const logout = useLogout();
  const [info, setInfo] = useState({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
  });
  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [infoMessage, setInfoMessage] = useState("");
  const [infoError, setInfoError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
        /* keep the session values already shown */
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
      <PageHeader title="Profile" description="Manage your account" />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card title="Personal Info">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setInfoError("");
              setInfoMessage("");
              void usersApi
                .updateProfile({
                  name: info.fullName.trim(),
                  email: info.email.trim(),
                  phone: info.phone.trim(),
                  address: info.address.trim(),
                })
                .then((saved) => {
                  replaceUser(saved);
                  setInfoMessage("Profile saved.");
                })
                .catch((error: unknown) => {
                  setInfoError(error instanceof Error ? error.message : "Could not save profile");
                });
            }}
          >
            <Input id="fullName" label="Full Name" value={info.fullName} onChange={setInfoField("fullName")} />
            <Input id="email" label="Email" type="email" value={info.email} onChange={setInfoField("email")} />
            <Input id="phone" label="Phone" type="tel" value={info.phone} onChange={setInfoField("phone")} />
            <Input id="address" label="Delivery Address" value={info.address} onChange={setInfoField("address")} />
            <div className="flex items-center gap-3">
              <Button type="submit">Save Changes</Button>
              {infoMessage && <span className="text-[13px] text-success">{infoMessage}</span>}
              {infoError && <span className="text-[13px] text-danger">{infoError}</span>}
            </div>
          </form>
        </Card>

        <Card title="Change Password">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setPasswordError("");
              setPasswordMessage("");
              if (passwords.next.length < 8) {
                setPasswordError("New password must be at least 8 characters");
                return;
              }
              void usersApi
                .changePassword(passwords.current, passwords.next)
                .then(() => {
                  setPasswords({ current: "", next: "" });
                  setPasswordMessage("Password updated.");
                })
                .catch((error: unknown) => {
                  setPasswordError(
                    error instanceof Error ? error.message : "Could not update password",
                  );
                });
            }}
          >
            <Input
              id="current"
              label="Current Password"
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            />
            <Input
              id="next"
              label="New Password"
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
            />
            {(passwordMessage || passwordError) && (
              <p className={passwordError ? "text-[13px] text-danger" : "text-[13px] text-success"}>
                {passwordError || passwordMessage}
              </p>
            )}
            <div className="flex items-center justify-between">
              <Button type="submit" variant="outline">
                Update Password
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
