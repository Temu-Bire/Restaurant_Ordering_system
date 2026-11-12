import { Link } from "react-router-dom";

import { HOME_BY_ROLE } from "../../app/paths";
import { useAuth } from "../../features/auth/useAuth";
import ThemeSwitcher from "../ThemeSwitcher";
import LinkButton from "../ui/LinkButton";

const links = [
  { label: "Menu", href: "#menu" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Order types", href: "#order-types" },
];

export default function PublicNavbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary font-bold text-white">
            R
          </span>
          <span className="text-xl font-bold">RestroGo</span>
        </Link>

        <nav aria-label="Page sections" className="hidden gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeSwitcher />
          </div>

          {user ? (
            <LinkButton to={HOME_BY_ROLE[user.role]}>Dashboard</LinkButton>
          ) : (
            <>
              <LinkButton to="/login" variant="outline">
                Log in
              </LinkButton>
              <LinkButton to="/register" className="hidden sm:inline-flex">
                Register
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}