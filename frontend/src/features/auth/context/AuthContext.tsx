import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";

import {
  clearSession,
  readSession,
  saveSession,
  UNAUTHORIZED_EVENT,
  type Session,
} from "../../../lib/session";
import type { User } from "../../../shared/types/user";
import * as authApi from "../api/authApi";
import type { RegisterInput } from "../api/authApi";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  replaceUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  // apiClient fires this when the server rejects our token
  useEffect(() => {
    const onUnauthorized = () => setSession(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  async function login(email: string, password: string) {
    const next = await authApi.login(email, password);
    saveSession(next);
    setSession(next);
    return next.user;
  }

  function logout() {
    void authApi.logout(); // sends the token before we clear it on the next line
    clearSession();
    setSession(null);
  }

  const replaceUser = useCallback((user: User) => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, user };
      saveSession(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        login,
        register: authApi.register,
        logout,
        replaceUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}