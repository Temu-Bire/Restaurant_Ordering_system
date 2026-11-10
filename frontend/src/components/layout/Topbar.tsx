import ThemeSwitcher from "../ThemeSwitcher";

export default function Topbar({ userInitials = "U" }: { userInitials?: string }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="search"
        placeholder="Search..."
        className="hidden w-48 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] outline-none placeholder:text-muted focus:border-primary sm:block"
      />
      <ThemeSwitcher />
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
        {userInitials}
      </div>
    </div>
  );
}