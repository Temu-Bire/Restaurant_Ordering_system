import { useAuth } from "../../features/auth/useAuth";
import ThemeSwitcher from "../ThemeSwitcher";
import LanguageSwitcher from "../LanguageSwitcher";
import { useTranslation } from "../../hooks/useTranslation";

export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Topbar({ search }: { search?: SearchProps }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {search && (
        <input
          type="search"
          aria-label={t("search")}
          placeholder={t("search")}
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          className="w-32 rounded-xl border border-border bg-surface px-3 py-2 text-[13px] outline-none placeholder:text-muted transition-all focus:border-primary focus:w-44 sm:w-44 sm:focus:w-52"
        />
      )}
      <LanguageSwitcher />
      <ThemeSwitcher />
      <div
        title={user?.name ?? "User"}
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-xs font-bold text-primary"
      >
        {user?.name.charAt(0) ?? "U"}
      </div>
    </div>
  );
}
