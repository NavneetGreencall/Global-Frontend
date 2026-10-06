/* =====================================================================
   Sample data for the Privacy Desk page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   Not shown by default: like the live app, this page starts empty.
   Pass these in to preview a filled page, e.g. <Page reports={SAMPLE_REPORTS} />.
   ===================================================================== */

import type { PrivacyRecord } from "@/pages/privacy-desk/PrivacyDeskPage";

export const SAMPLE_REQUESTS: PrivacyRecord[] = [
  { id: "DSR-0007", title: "Copy of verification report", subjectRef: "SUBJ-4471", type: "access", status: "in_review", receivedAt: "2026-09-26T11:00:00+05:30", dueAt: "2026-10-26T11:00:00+05:30" },
  { id: "DSR-0006", title: "Correct date of birth", subjectRef: "SUBJ-4402", type: "correction", status: "decided", receivedAt: "2026-09-10T15:20:00+05:30", dueAt: "2026-10-10T15:20:00+05:30" },
];

export const SAMPLE_INCIDENTS: PrivacyRecord[] = [
  { id: "PI-0002", title: "Report emailed to wrong client contact", subjectRef: "CASE-SG-20260902", type: "misdirected", status: "contained", receivedAt: "2026-09-28T10:05:00+05:30", dueAt: null },
];
