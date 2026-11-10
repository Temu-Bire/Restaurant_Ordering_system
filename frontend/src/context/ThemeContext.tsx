import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Allowed theme values
export type Theme = "light" | "dark" | "system";

// Data shared with components
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Create context
export const ThemeContext = createContext<ThemeContextType | null>(null);

// Provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("restrogo-theme");

    if (
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
    ) {
      return savedTheme;
    }

    return "system";
  });

  // Apply theme and save user preference
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    localStorage.setItem("restrogo-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}