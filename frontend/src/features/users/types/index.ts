import type { Role, User } from "../../../shared/types/user";

export type { Role, User };

export interface ApiUser {
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

export interface CreateUserInput {
  name: string;
  email: string;
  role: Role;
  active: boolean;
  password: string;
}

export interface UpdateUserInput {
  name: string;
  email: string;
  role: Role;
  active: boolean;
}
