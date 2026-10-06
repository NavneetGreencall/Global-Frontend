/* =====================================================================
   Sample data for the Verifier Operations page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { Verifier } from "@/pages/verifier-operations/VerifierOperationsPage";

export const VERIFIERS: Verifier[] = [
  { id: "v1", name: "Verifier", branch: null, active: 8, overdue: 0, doneToday: 0 },
  { id: "v2", name: "Verification Specialist", branch: "Head Office", active: 0, overdue: 0, doneToday: 0 },
  { id: "v3", name: "Verifier", branch: "Head Office", active: 0, overdue: 0, doneToday: 0 },
  { id: "v4", name: "Verifier", branch: null, active: 0, overdue: 0, doneToday: 0 },
];

export const UNALLOCATED = 36; // checks without an owner
