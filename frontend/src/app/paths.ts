import type { Role, User } from "../types/user";

export const HOME_BY_ROLE: Record<Role, string> = {
  customer: "/customer/home",
  staff: "/staff/dashboard",
  admin: "/admin/dashboard",
};

// After login: go back to the page the user was trying to open,
// but only if it belongs to their own area. Otherwise go to their home.
export function landingPath(user: User, from?: string) {
  if (from && from.startsWith(`/${user.role}`)) return from;
  return HOME_BY_ROLE[user.role];
}