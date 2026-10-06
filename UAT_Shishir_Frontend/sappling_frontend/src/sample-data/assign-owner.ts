/* =====================================================================
   Sample data for the "Assign owner" dialog (people who can own a case).
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   ===================================================================== */

import type { DirectoryUser } from "@/lib/backend-api/users";

export type SamplePerson = Pick<DirectoryUser, "id" | "displayName" | "email" | "roles">;

export const SAMPLE_PEOPLE: SamplePerson[] = [
  { id: "u-ops1", displayName: "Neha Verma", email: "neha@saplingglobal.in", roles: [{ code: "OPERATIONS_MANAGER", name: "Operations Manager" }] },
  { id: "u-ops2", displayName: "Arjun Mehta", email: "arjun@saplingglobal.in", roles: [{ code: "OPERATIONS_MANAGER", name: "Operations Manager" }] },
  { id: "u-adm", displayName: "Nikhil", email: "nikhil@saplingglobal.in", roles: [{ code: "PLATFORM_ADMIN", name: "Platform Admin" }] },
];
