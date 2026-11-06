export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}