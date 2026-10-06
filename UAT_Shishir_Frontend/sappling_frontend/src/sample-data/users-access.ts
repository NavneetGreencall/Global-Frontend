/* =====================================================================
   Sample data for the Users Access page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { PlatformUser } from "@/pages/users-access/UsersAccessPage";

export const USERS: PlatformUser[] = [
  { id: "u1", name: "Acme Client Admin", email: "client@acme.local", roles: ["client_admin"], scope: "Head Office", status: "active", lastLogin: "2026-08-25T18:02:00+05:30" },
  { id: "u2", name: "CEO", email: "acmetechsolutions@gmail.com", roles: ["client_admin"], scope: "All branches", status: "active", lastLogin: "2026-09-30T13:01:00+05:30" },
  { id: "u3", name: "CEO", email: "nikhil@gmail.com", roles: ["client_admin"], scope: "All branches", status: "active", lastLogin: "2026-09-12T12:10:00+05:30" },
  { id: "u4", name: "Client Admin", email: "uat.clientadmin@greencall.com", roles: ["client_admin"], scope: "All branches", status: "active", lastLogin: "2026-09-29T09:28:00+05:30" },
  { id: "u5", name: "Client Administrator", email: "client@greencall.com", roles: ["client_admin"], scope: "All branches", status: "active", lastLogin: "2026-09-14T12:21:00+05:30" },
  { id: "u6", name: "Field Executive", email: "field@greencall.com", roles: ["field_executive"], scope: "Head Office", status: "active", lastLogin: "2026-09-14T10:02:00+05:30" },
  // SAMPLE rows below — replace with real data
  { id: "u7", name: "Verification Specialist", email: "verifier@greencall.com", roles: ["verifier", "qa_reviewer"], scope: "Head Office", status: "active", lastLogin: "2026-09-29T17:40:00+05:30" },
  { id: "u8", name: "New Operations User", email: "ops.new@greencall.com", roles: ["operations"], scope: "Head Office", status: "invited", lastLogin: null },
  { id: "u9", name: "Former Verifier", email: "old.verifier@greencall.com", roles: ["verifier"], scope: "All branches", status: "disabled", lastLogin: "2026-06-02T11:15:00+05:30" },
];
