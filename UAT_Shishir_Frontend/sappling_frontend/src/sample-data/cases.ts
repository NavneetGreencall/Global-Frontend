/* =====================================================================
   Sample data for the Cases page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { CaseRow } from "@/pages/cases/CasesPage";

export const CASES: CaseRow[] = [
  { id: "SG-20260928-600E89", candidate: "Vivo", client: "Acme Tech Solutions", pkg: "Standard BGV", checks: 4, stage: "verification", progress: 62, priority: "critical", slaMinutes: -85, owner: null, updated: "2026-09-28" },
  { id: "SG-20260926-691868", candidate: "REALME", client: "Acme Tech Solutions", pkg: "Standard BGV", checks: 4, stage: "verification", progress: 62, priority: "high", slaMinutes: -1560, owner: null, updated: "2026-09-26" },
  { id: "SG-20260830-6B1CF5", candidate: "Harsh Singh", client: "Acme India", pkg: "Standard BGV", checks: 4, stage: "consent", progress: 10, priority: "critical", slaMinutes: -39240, owner: null, updated: "2026-08-30" },
  { id: "SG-20260831-D90636", candidate: "Avneet", client: "Acme India", pkg: "Standard BGV", checks: 4, stage: "consent", progress: 10, priority: "critical", slaMinutes: -40300, owner: null, updated: "2026-08-31" },
  // SAMPLE rows below — replace with real data
  { id: "SG-20260924-A1B2C3", candidate: "Ananya Rao", client: "Acme Tech Solutions", pkg: "HIGHPACKAGE", checks: 6, stage: "documents", progress: 35, priority: "medium", slaMinutes: -300, owner: null, updated: "2026-09-24" },
  { id: "SG-20260922-B4C5D6", candidate: "Rohit Mehra", client: "Nikhil Tech", pkg: "Standard BGV", checks: 4, stage: "qa", progress: 88, priority: "medium", slaMinutes: 2880, owner: null, updated: "2026-09-27" },
  { id: "SG-20260921-C7D8E9", candidate: "Priya Nair", client: "Vision India Pvt Limited.", pkg: "Standard BGV", checks: 4, stage: "qa", progress: 85, priority: "low", slaMinutes: 600, owner: null, updated: "2026-09-27" },
  { id: "SG-20260920-D1E2F3", candidate: "Karan Patel", client: "IRFC", pkg: "Standard BGV", checks: 4, stage: "documents", progress: 30, priority: "high", slaMinutes: 180, owner: null, updated: "2026-09-25" },
  { id: "SG-20260919-E4F5A6", candidate: "Meera Iyer", client: "Navneet Kirana", pkg: "Standard BGV", checks: 4, stage: "verification", progress: 55, priority: "low", slaMinutes: 4320, owner: null, updated: "2026-09-23" },
  { id: "SG-20260918-F7A8B9", candidate: "Arjun Singh", client: "Vision India Pvt Limited.", pkg: "HIGHPACKAGE", checks: 6, stage: "documents", progress: 40, priority: "medium", slaMinutes: -120, owner: null, updated: "2026-09-22" },
];
