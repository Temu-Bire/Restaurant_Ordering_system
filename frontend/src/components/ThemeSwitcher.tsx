import { useTheme } from "../hooks/useTheme";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <label htmlFor="theme">Appearance: </label>

      <select
        id="theme"
        value={theme}
        onChange={(event) =>
          setTheme(event.target.value as "light" | "dark" | "system")
        }
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}