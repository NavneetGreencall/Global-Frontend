/* =====================================================================
   Sample data for the signed-in user (sidebar, header avatar).
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   ===================================================================== */

import type { ShellUser } from "@/layout/types";

/** In live mode the real user comes from the session (src/auth/session.tsx). */
export const SAMPLE_USER: ShellUser = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} };
