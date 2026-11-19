import type { Role, User } from "../../../shared/types/user";

export interface RegisterInput {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface ApiUser {
  id: string | number;
  fullName?: string;
  name?: string;
  email: string;
  role: string;
  isActive?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: ApiUser;
}

export type { Role, User };
