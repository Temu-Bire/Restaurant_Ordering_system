import { Link } from "react-router-dom";
import { restaurantInfo } from "../../mocks/settings";
import { useTranslation } from "../../hooks/useTranslation";

export default function PublicFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-bold text-white shadow-sm">
              R
            </span>
            <span className="text-xl font-bold">{restaurantInfo.name}</span>
          </div>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted">
            {t("brandTagline")}
          </p>
        </div>

        <div className="text-[13px]">
          <h2 className="mb-2 font-bold text-foreground">{t("contact")}</h2>
          <p className="text-muted">{restaurantInfo.address}</p>
          <p className="mt-1 text-muted">{restaurantInfo.phone}</p>
        </div>

        <div className="text-[13px]">
          <h2 className="mb-2 font-bold text-foreground">{t("account")}</h2>
          <ul className="space-y-1.5">
            <li>
              <Link to="/login" className="text-muted transition-colors hover:text-foreground">
                {t("navLogin")}
              </Link>
            </li>
            <li>
              <Link to="/register" className="text-muted transition-colors hover:text-foreground">
                {t("createAccount")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <p className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {restaurantInfo.name}. {t("rightsReserved")}
      </p>
    </footer>
  );
}
