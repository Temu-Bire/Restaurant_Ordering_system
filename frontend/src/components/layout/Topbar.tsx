import { useAuth } from "../../features/auth/useAuth";
import ThemeSwitcher from "../ThemeSwitcher";

export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Topbar({ search }: { search?: SearchProps }) {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-3 print:hidden">
      {search && (
        <input
          type="search"
          aria-label="Search"
          placeholder="Search..."
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] outline-none placeholder:text-muted focus:border-primary sm:w-52"
        />
      )}
      <ThemeSwitcher />
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
        {user?.name.charAt(0) ?? "U"}
      </div>
    </div>
  );
}