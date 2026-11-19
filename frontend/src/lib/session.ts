import type { User } from "../shared/types/user";

export interface Session {
  user: User;
  token: string;
}

const KEY = "restrogo-session";
const ROLES = ["customer", "staff", "admin"];

export const UNAUTHORIZED_EVENT = "auth:unauthorized";

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as Session;
    return session?.token && session?.user && ROLES.includes(session.user.role)
      ? session
      : null;
  } catch {
    return null; // corrupted or blocked storage: treat as logged out
  }
}

export const saveSession = (session: Session) =>
  localStorage.setItem(KEY, JSON.stringify(session));

export const clearSession = () => localStorage.removeItem(KEY);

export const getToken = () => readSession()?.token ?? null;