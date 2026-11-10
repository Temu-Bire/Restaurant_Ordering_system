export type Role = "customer" | "staff" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export const ROLE_LABEL: Record<Role, string> = {
  customer: "Customer",
  staff: "Staff",
  admin: "Admin",
};

export const roleOptions = (Object.keys(ROLE_LABEL) as Role[]).map((value) => ({
  value,
  label: ROLE_LABEL[value],
}));