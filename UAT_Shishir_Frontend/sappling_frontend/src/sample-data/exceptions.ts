/* =====================================================================
   Sample data for the Exceptions page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { ExceptionItem, ExceptionStats } from "@/pages/exceptions/ExceptionsPage";

export const STATS: ExceptionStats = { open: 15, uniqueCases: 15, critical: 10, avgAgeHours: 480, resolvedToday: 0 };

export const ITEMS: ExceptionItem[] = [
  { id: "ex1", caseId: "SG-20260826-DAE1C8", candidate: "Niku Kumar", client: "Navneet Kirana", severity: "critical", category: "sla", overdue: true, issue: "Case is past its committed due date", owner: "Operations", ageHours: 795 },
  { id: "ex2", caseId: "SG-20260831-D90636", candidate: "Avneet", client: "Navneet Kirana", severity: "critical", category: "sla", overdue: true, issue: "Case is past its committed due date", owner: "Operations", ageHours: 676 },
  { id: "ex3", caseId: "SG-20260831-F0C169", candidate: "rahul saharma", client: "Navneet Kirana", severity: "critical", category: "sla", overdue: true, issue: "Case is past its committed due date", owner: "Operations", ageHours: 628 },
  { id: "ex4", caseId: "SG-20260831-2E7182", candidate: "Rahul Sharma", client: "Navneet Kirana", severity: "critical", category: "sla", overdue: true, issue: "Case is past its committed due date", owner: "Operations", ageHours: 627 },
  // SAMPLE rows below — replace with real data
  { id: "ex5", caseId: "SG-20260924-A1B2C3", candidate: "Ananya Rao", client: "Acme Tech Solutions", severity: "high", category: "discrepancy", overdue: false, issue: "Employment dates don't match the relieving letter", owner: "Verifier", ageHours: 52 },
  { id: "ex6", caseId: "SG-20260920-D1E2F3", candidate: "Karan Patel", client: "IRFC", severity: "medium", category: "documents", overdue: false, issue: "Degree certificate is missing", owner: "Client", ageHours: 30 },
  { id: "ex7", caseId: "SG-20260918-F7A8B9", candidate: "Arjun Singh", client: "Vision India Pvt Limited.", severity: "low", category: "consent", overdue: false, issue: "Consent form not yet signed", owner: "Candidate", ageHours: 8 },
];
