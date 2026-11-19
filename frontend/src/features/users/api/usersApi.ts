import { api } from "../../../lib/apiClient";
import { toUser } from "../../auth/api/authApi";
import type { Role, User } from "../../../shared/types/user";

interface ApiUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: string;
  isActive: boolean;
}

export interface Profile {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const toApiRole = (role: Role) => role.toUpperCase();

export async function listUsers(): Promise<User[]> {
  const users = await api.get<ApiUser[]>("/users");
  return users.map(toUser);
}

export async function createUser(input: {
  name: string;
  email: string;
  role: Role;
  active: boolean;
  password: string;
}): Promise<User> {
  const user = await api.post<ApiUser>("/users", {
    fullName: input.name,
    email: input.email,
    password: input.password,
    role: toApiRole(input.role),
    isActive: input.active,
  });
  return toUser(user);
}

export async function updateUser(
  id: string,
  input: { name: string; email: string; role: Role; active: boolean },
): Promise<User> {
  const user = await api.patch<ApiUser>(`/users/${id}`, {
    fullName: input.name,
    email: input.email,
    role: toApiRole(input.role),
    isActive: input.active,
  });
  return toUser(user);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function getProfile(): Promise<Profile & { user: User }> {
  const profile = await api.get<ApiUser>("/auth/me");
  return {
    user: toUser(profile),
    name: profile.fullName,
    email: profile.email,
    phone: profile.phone ?? "",
    address: profile.address ?? "",
  };
}

export async function updateProfile(input: Profile): Promise<User> {
  const profile = await api.patch<ApiUser>("/auth/me", {
    fullName: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
  });
  return toUser(profile);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await api.post("/auth/password", { currentPassword, newPassword });
}
