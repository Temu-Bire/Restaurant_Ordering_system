import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export default function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground shadow-xs transition-all hover:bg-surface-secondary hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ${className}`}
    >
      {isDark ? (
        <Sun className="size-4.5 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="size-4.5 text-slate-700 transition-transform hover:-rotate-12 dark:text-slate-200" />
      )}
    </button>
  );
}
