import type { Role } from '../types';

export const PATHS = {
  LOGIN: '/login',
  REGISTER: '/register',
  UNAUTHORIZED: '/unauthorized',
  CUSTOMER_HOME: '/menu',
  STAFF_HOME: '/staff/orders',
  ADMIN_HOME: '/admin/dashboard',
} as const;

// Where each role goes after login
export const homeByRole: Record<Role, string> = {
  CUSTOMER: PATHS.CUSTOMER_HOME,
  STAFF: PATHS.STAFF_HOME,
  ADMIN: PATHS.ADMIN_HOME,
};