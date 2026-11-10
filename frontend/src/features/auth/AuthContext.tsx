import { createContext, useState, type ReactNode } from "react";

import type { User } from "../../types/user";
import * as authApi from "./authApi";
import type { RegisterInput, Session } from "./authApi";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "restrogo-session";
const ROLES = ["customer", "staff", "admin"];

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as Session;
    return session?.user && ROLES.includes(session.user.role) ? session : null;
  } catch {
    return null; // corrupted or blocked storage: treat as logged out
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  async function login(email: string, password: string) {
    const next = await authApi.login(email, password);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    return next.user;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        login,
        register: authApi.register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}