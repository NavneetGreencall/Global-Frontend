import type { DirectoryRole, DirectoryUser } from "@/lib/backend-api/users";
import type { PlatformUser, UserStatus } from "./UsersAccessPage";

/* =====================================================================
   Converts users.ts data into what the User IDs & Access page shows.
   ===================================================================== */

/** API status → page status */
export function statusOf(apiStatus: string): UserStatus {
  const s = apiStatus.toUpperCase();
  if (s === "SUSPENDED" || s === "DISABLED" || s === "INACTIVE") return "disabled";
  if (s === "INVITED" || s === "PENDING") return "invited";
  return "active";
}

/** Page status filter → API status filter */
export const API_STATUS: Record<string, "ACTIVE" | "SUSPENDED" | "INVITED" | undefined> = {
  all: undefined,
  active: "ACTIVE",
  invited: "INVITED",
  disabled: "SUSPENDED",
};

/** "CLIENT_ADMIN" → "client_admin" (the page's role keys) */
export const roleKey = (code: string) => code.toLowerCase();

export function toPlatformUser(u: DirectoryUser): PlatformUser {
  return {
    id: u.id,
    name: u.displayName || u.email,
    email: u.email,
    roles: u.roles.map((r) => roleKey(r.code)),
    scope: u.branch?.name ?? (u.client ? u.client.displayName : "All branches"),
    status: statusOf(u.status),
    lastLogin: u.lastLoginAt ?? null,
  };
}

export function toRoleOptions(roles: DirectoryRole[]) {
  return roles.map((r) => ({ value: roleKey(r.code), label: r.name }));
}
