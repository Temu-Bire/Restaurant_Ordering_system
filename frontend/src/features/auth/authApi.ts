import { users } from "../../mocks/users";
import type { User } from "../../types/user";

export interface Session {
  user: User;
  token: string;
}

export interface RegisterInput {
  name: string;
  phone: string;
  email: string;
  password: string;
}

const DEMO_PASSWORD = "password123";

// In-memory only: accounts created through Register are lost on refresh
const accounts = users.map((user) => ({ user, password: DEMO_PASSWORD }));

const wait = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));
const sameEmail = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

export async function login(email: string, password: string): Promise<Session> {
  await wait();

  const account = accounts.find((a) => sameEmail(a.user.email, email));

  // Same message for unknown email and wrong password, so accounts can't be probed
  if (!account || account.password !== password) {
    throw new Error("Invalid email or password");
  }
  if (!account.user.active) {
    throw new Error("This account is disabled. Please contact the restaurant.");
  }

  return { user: account.user, token: "mock-token" };
}

export async function register(input: RegisterInput): Promise<void> {
  await wait();

  if (accounts.some((a) => sameEmail(a.user.email, input.email))) {
    throw new Error("An account with this email already exists");
  }

  accounts.push({
    user: {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email.trim(),
      role: "customer", // public sign-up is always a customer
      active: true,
    },
    password: input.password,
  });
}