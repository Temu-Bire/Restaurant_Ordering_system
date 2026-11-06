import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { TOKEN_KEY } from '../api/axios';
import {
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
} from '../api/auth.api';
import type { LoginPayload, RegisterPayload, User } from '../types';

export interface AuthContextValue {
  user: User | null;
  loading: boolean; // true while restoring the session on page load
  login: (data: LoginPayload) => Promise<User>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session after a page refresh (criterion 18)
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    meRequest()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (data: LoginPayload) => {
    const res = await loginRequest(data);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    setUser(res.user);
    return res.user; // the caller uses the role to redirect
  }, []);

  const register = useCallback(async (data: RegisterPayload) => {
    await registerRequest(data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // ignore: we remove the token either way
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}