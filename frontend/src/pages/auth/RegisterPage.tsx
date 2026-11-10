import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

interface Form {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

const empty: Form = { fullName: "", phone: "", email: "", password: "" };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Partial<Form>>({});

  const update =
    (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const next: Partial<Form> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.phone.trim()) next.phone = "Phone is required";
    if (!form.email.trim()) next.email = "Email is required";
    if (form.password.length < 8)
      next.password = "Password must be at least 8 characters";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // TEMP: no backend yet. Later this calls authApi.register().
    navigate("/login");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-2xl font-bold">Create account</h2>
        <p className="mt-1 text-[13px] text-muted">Register as a customer</p>
      </div>

      <Input
        id="fullName"
        label="Full Name"
        placeholder="John Doe"
        value={form.fullName}
        onChange={update("fullName")}
        error={errors.fullName}
      />
      <Input
        id="phone"
        label="Phone"
        type="tel"
        placeholder="+251 9XX XXX XXX"
        value={form.phone}
        onChange={update("phone")}
        error={errors.phone}
      />
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="john@email.com"
        value={form.email}
        onChange={update("email")}
        error={errors.email}
      />
      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        value={form.password}
        onChange={update("password")}
        error={errors.password}
      />

      <Button type="submit" fullWidth>
        Register
      </Button>

      <p className="text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary">
          Log in
        </Link>
      </p>
    </form>
  );
}