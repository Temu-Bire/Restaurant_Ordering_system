import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { useTranslation } from "../../hooks/useTranslation";
import { HOME_BY_ROLE } from "../../app/paths";
import ArifLogo from "../ui/ArifLogo";
import Button from "../ui/Button";
import Input from "../ui/Input";

export type AuthMode = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({
  isOpen,
  initialMode = "login",
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { login, register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regErrors, setRegErrors] = useState<{
    fullName?: string;
    phone?: string;
    email?: string;
    password?: string;
  }>({});

  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFormError("");
      setSuccessMsg("");
      setLoginErrors({});
      setRegErrors({});
    }
  }, [isOpen, initialMode]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: typeof loginErrors = {};
    if (!loginEmail.trim()) nextErrors.email = "Email is required";
    if (!loginPassword) nextErrors.password = "Password is required";
    setLoginErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFormError("");
    setSubmitting(true);

    try {
      const loggedUser = await login(loginEmail, loginPassword);
      setSubmitting(false);
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        if (loggedUser.role === "admin" || loggedUser.role === "staff") {
          navigate(HOME_BY_ROLE[loggedUser.role]);
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Invalid email or password");
      setSubmitting(false);
    }
  }

  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: typeof regErrors = {};
    if (!regFullName.trim()) nextErrors.fullName = "Full name is required";
    if (!regPhone.trim()) nextErrors.phone = "Phone number is required";
    if (!regEmail.trim()) nextErrors.email = "Email is required";
    if (regPassword.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    setRegErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFormError("");
    setSubmitting(true);

    try {
      await register({
        name: regFullName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });

      // Automatically log them in after registration
      try {
        const loggedUser = await login(regEmail.trim(), regPassword);
        setSubmitting(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else if (loggedUser.role === "admin" || loggedUser.role === "staff") {
          navigate(HOME_BY_ROLE[loggedUser.role]);
        }
      } catch {
        // Fallback: switch to login mode with prefilled email
        setLoginEmail(regEmail.trim());
        setMode("login");
        setSuccessMsg("Account created successfully! Please log in.");
        setSubmitting(false);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create account");
      setSubmitting(false);
    }
  }

  // Quick fill helper for demo accounts
  function fillDemo(email: string) {
    setLoginEmail(email);
    setLoginPassword("password123");
    setFormError("");
    setLoginErrors({});
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl transition-all duration-300 transform scale-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-surface-secondary text-muted transition-colors hover:bg-orange-500/10 hover:text-orange-500"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header & Brand */}
        <div className="flex flex-col items-center text-center">
          <ArifLogo size="md" asLink={false} />

          {/* Tab Switcher: Log In / Register */}
          <div className="mt-5 flex w-full max-w-xs rounded-full bg-surface-secondary p-1 border border-border">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setFormError("");
              }}
              className={`flex-1 rounded-full py-1.5 text-xs font-bold transition-all duration-200 ${
                mode === "login"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("navLogin")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setFormError("");
              }}
              className={`flex-1 rounded-full py-1.5 text-xs font-bold transition-all duration-200 ${
                mode === "register"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("navRegister")}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mt-4 rounded-xl bg-green-500/10 p-3 text-xs text-green-600 dark:text-green-400 border border-green-500/20">
            {successMsg}
          </div>
        )}
        {formError && (
          <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 border border-red-500/20">
            {formError}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-3.5" noValidate>
            <Input
              id="login-email"
              label={t("email")}
              type="email"
              placeholder="e.g. dawit@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              error={loginErrors.email}
            />

            <Input
              id="login-password"
              label={t("password")}
              type="password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              error={loginErrors.password}
            />

            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              className="mt-2 rounded-full bg-orange-500 hover:bg-orange-600 py-2.5 font-bold shadow-md shadow-orange-500/20"
            >
              {submitting ? t("loading") : t("navLogin")}
            </Button>

            {/* Quick Demo Accounts */}
            <div className="mt-4 rounded-2xl border border-border bg-surface-secondary/70 p-3">
              <p className="text-[11px] font-bold text-foreground">
                Demo Accounts (1-click fill):
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => fillDemo("admin@habesha.com")}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-orange-500 hover:text-orange-500"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("staff@habesha.com")}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-orange-500 hover:text-orange-500"
                >
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("dawit@email.com")}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-orange-500 hover:text-orange-500"
                >
                  Customer
                </button>
              </div>
            </div>

            <p className="pt-2 text-center text-xs text-muted">
              {t("noAccount")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setFormError("");
                }}
                className="font-bold text-orange-500 hover:underline"
              >
                {t("navRegister")}
              </button>
            </p>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3" noValidate>
            <Input
              id="reg-name"
              label={t("fullName")}
              placeholder="e.g. Abebe Bikila"
              value={regFullName}
              onChange={(e) => setRegFullName(e.target.value)}
              error={regErrors.fullName}
            />

            <Input
              id="reg-phone"
              label={t("phone")}
              type="tel"
              placeholder="+251 911 223344"
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              error={regErrors.phone}
            />

            <Input
              id="reg-email"
              label={t("email")}
              type="email"
              placeholder="user@example.com"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              error={regErrors.email}
            />

            <Input
              id="reg-password"
              label={t("password")}
              type="password"
              placeholder="At least 8 characters"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              error={regErrors.password}
            />

            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              className="mt-2 rounded-full bg-orange-500 hover:bg-orange-600 py-2.5 font-bold shadow-md shadow-orange-500/20"
            >
              {submitting ? t("loading") : t("createAccount")}
            </Button>

            <p className="pt-2 text-center text-xs text-muted">
              {t("alreadyHaveAccount")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setFormError("");
                }}
                className="font-bold text-orange-500 hover:underline"
              >
                {t("navLogin")}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
