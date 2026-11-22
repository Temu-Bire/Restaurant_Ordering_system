import { useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import Button from "../../../shared/components/ui/Button";
import Input from "../../../shared/components/ui/Input";

interface Form {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const empty: Form = { fullName: "", phone: "", email: "", password: "", confirmPassword: "" };

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <EyeOff className="size-4 text-muted hover:text-orange-500 transition-colors" />
  ) : (
    <Eye className="size-4 text-muted hover:text-orange-500 transition-colors" />
  );
}

export default function RegisterPage() {
  const { register, login } = useAuth();
  const { t } = useTranslation();
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = (location.state as { from?: string } | undefined)?.from;
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const update =
    (field: keyof Form) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const next: Partial<Form> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.phone.trim()) next.phone = "Phone is required";
    if (!form.email.trim()) next.email = "Email is required";
    if (form.password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError("");
    setSubmitting(true);

    try {
      await register({
        name: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      // Automatically log them in after registration
      try {
        await login(form.email.trim(), form.password);
        navigate(redirectTarget || "/customer/menu");
      } catch {
        navigate("/login", { state: { registered: true, from: redirectTarget } });
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{t("registerTitle")}</h2>
        <p className="mt-1 text-xs sm:text-sm text-muted">Create your Arif Food account in seconds</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Input
          id="fullName"
          label={t("fullName")}
          placeholder="Abebe Bikila"
          value={form.fullName}
          onChange={update("fullName")}
          error={errors.fullName}
        />
        <Input
          id="phone"
          label={t("phone")}
          type="tel"
          placeholder="+251 911 223344"
          value={form.phone}
          onChange={update("phone")}
          error={errors.phone}
        />
      </div>

      <Input
        id="email"
        label={t("email")}
        type="email"
        placeholder="user@example.com"
        value={form.email}
        onChange={update("email")}
        error={errors.email}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Input
          id="password"
          label={t("password")}
          type={showPassword ? "text" : "password"}
          placeholder="At least 8 characters"
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="focus:outline-none"
            >
              <EyeIcon visible={showPassword} />
            </button>
          }
        />

        <Input
          id="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          error={errors.confirmPassword}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="focus:outline-none"
            >
              <EyeIcon visible={showConfirmPassword} />
            </button>
          }
        />
      </div>

      {formError && (
        <p role="alert" className="text-xs text-danger">
          {formError}
        </p>
      )}

      <Button type="submit" fullWidth disabled={submitting} className="rounded-full bg-orange-500 hover:bg-orange-600 py-3 font-bold text-sm">
        {submitting ? t("loading") : t("navRegister")}
      </Button>

      <p className="text-center text-xs text-muted pt-2 border-t border-border">
        {t("alreadyHaveAccount")}{" "}
        <Link to="/login" className="font-bold text-orange-500 hover:underline ml-1">
          {t("navLogin")}
        </Link>
      </p>
    </form>
  );
}
