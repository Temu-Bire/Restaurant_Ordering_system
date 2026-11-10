import type { User } from "../types/user";

export const users: User[] = [
  { id: "1", name: "John Doe", email: "john@email.com", role: "customer", active: true },
  { id: "2", name: "Sara Tesfaye", email: "sara@restro.com", role: "staff", active: true },
  { id: "3", name: "Dawit Alemu", email: "dawit@restro.com", role: "staff", active: true },
  { id: "4", name: "Admin", email: "admin@restro.com", role: "admin", active: true },
  { id: "5", name: "Mary K.", email: "mary@email.com", role: "customer", active: false },
];