import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

export default function ProfilePage() {
  const navigate = useNavigate();

  // TEMP values: later they come from AuthContext / the API
  const [info, setInfo] = useState({
    fullName: "John Doe",
    email: "john@email.com",
    phone: "+251 9XX XXX XXX",
    address: "Bole, Addis Ababa",
  });
  const [passwords, setPasswords] = useState({ current: "", next: "" });

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
              // TEMP: later calls the update-profile API
            }}
          >
            <Input id="fullName" label="Full Name" value={info.fullName} onChange={setInfoField("fullName")} />
            <Input id="email" label="Email" type="email" value={info.email} onChange={setInfoField("email")} />
            <Input id="phone" label="Phone" type="tel" value={info.phone} onChange={setInfoField("phone")} />
            <Input id="address" label="Delivery Address" value={info.address} onChange={setInfoField("address")} />
            <Button type="submit">Save Changes</Button>
          </form>
        </Card>

        <Card title="Change Password">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              // TEMP: later calls the change-password API
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
            <div className="flex items-center justify-between">
              <Button type="submit" variant="outline">
                Update Password
              </Button>
              <Button type="button" variant="danger" onClick={() => navigate("/login")}>
                Log out
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}