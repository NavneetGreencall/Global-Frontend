/* =====================================================================
   Sample data for the Released Reports page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   Not shown by default: like the live app, this page starts empty.
   Pass these in to preview a filled page, e.g. <Page reports={SAMPLE_REPORTS} />.
   ===================================================================== */

import type { ReleasedReport } from "@/pages/released-reports/ReleasedReportsPage";

export const SAMPLE_REPORTS: ReleasedReport[] = [
  { id: "r1", caseId: "SG-20260908-9A1B2C", candidate: "Nikhil Verma", client: "Nikhil Tech", pkg: "Standard BGV", checks: 4, verdict: "clear", releasedAt: "2026-09-08T16:20:00+05:30", fileUrl: "#" },
  { id: "r2", caseId: "SG-20260902-7C8D9E", candidate: "Sneha Joshi", client: "Acme Tech Solutions", pkg: "HIGHPACKAGE", checks: 6, verdict: "discrepancy", releasedAt: "2026-09-02T11:05:00+05:30", fileUrl: "#" },
];
