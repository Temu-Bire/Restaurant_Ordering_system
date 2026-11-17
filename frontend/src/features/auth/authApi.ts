import { api } from "../../lib/apiClient";
import type { Session } from "../../lib/session";
import type { Role, User } from "../../types/user";

export interface RegisterInput {
  name: string;
  phone: string;
  email: string;
  password: string;
}

/* ---- Shape the NestJS backend returns. Adjust here if yours differs ---- */
interface ApiUser {
  id: string | number;
  fullName?: string;
  name?: string;
  email: string;
  role: string;
  isActive?: boolean;
}

interface LoginResponse {
  accessToken: string;
  user: ApiUser;
}

export function toUser(u: ApiUser): User {
  const role = u.role.toLowerCase();

  if (!["customer", "staff", "admin"].includes(role)) {
    throw new Error(`Unknown role from server: ${u.role}`);
  }

  return {
    id: String(u.id),
    name: u.fullName ?? u.name ?? u.email,
    email: u.email,
    role: role as Role,
    active: u.isActive ?? true,
  };
}

export async function login(email: string, password: string): Promise<Session> {
  const res = await api.post<LoginResponse>(
    "/auth/login",
    { email: email.trim(), password },
    { auth: false }
  );

  return { token: res.accessToken, user: toUser(res.user) };
}

export async function register(input: RegisterInput): Promise<void> {
  await api.post(
    "/auth/register",
    {
      fullName: input.name,
      phone: input.phone,
      email: input.email,
      password: input.password,
    },
    { auth: false }
  );
}

// Best effort: the user is logged out locally even if this call fails
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    /* ignore */
  }
}