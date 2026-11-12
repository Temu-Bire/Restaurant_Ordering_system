import { generatePath } from "react-router-dom";
import type { Role, User } from "../types/user";

export const PATHS = {
  home: "/",
  login: "/login",
  register: "/register",

  customer: {
    root: "/customer",
    home: "/customer/home",
    menu: "/customer/menu",
    cart: "/customer/cart",
    orders: "/customer/orders",
    track: "/customer/orders/:id/track", // pattern, use trackPath(id) to link
    receipt: "/customer/orders/:id/receipt", // pattern, use receiptPath(id) to link
    profile: "/customer/profile",
  },

  staff: {
    root: "/staff",
    dashboard: "/staff/dashboard",
    orders: "/staff/orders",
    tables: "/staff/tables",
    inventory: "/staff/inventory",
    payments: "/staff/payments",
  },

  admin: {
    root: "/admin",
    dashboard: "/admin/dashboard",
    orders: "/admin/orders",
    menu: "/admin/menu",
    tables: "/admin/tables",
    inventory: "/admin/inventory",
    payments: "/admin/payments",
    reports: "/admin/reports",
    users: "/admin/users",
    settings: "/admin/settings",
  },
} as const;

// Builders for routes with parameters
export const trackPath = (id: string) =>
  generatePath(PATHS.customer.track, { id });
export const receiptPath = (id: string) =>
  generatePath(PATHS.customer.receipt, { id });

export const HOME_BY_ROLE: Record<Role, string> = {
  customer: PATHS.customer.home,
  staff: PATHS.staff.dashboard,
  admin: PATHS.admin.dashboard,
};

// After login: go back to the page the user was trying to open,
// but only if it belongs to their own area. Otherwise go to their home.
export function landingPath(user: User, from?: string) {
  if (from && from.startsWith(`/${user.role}`)) return from;
  return HOME_BY_ROLE[user.role];
}