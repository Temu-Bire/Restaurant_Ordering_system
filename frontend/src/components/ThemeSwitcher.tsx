import { useTheme } from "../hooks/useTheme";
import type { Theme } from "../context/ThemeContext";
import Select from "./ui/Select";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-28">
      <Select
        aria-label="Appearance"
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ]}
      />
    </div>
  );
}