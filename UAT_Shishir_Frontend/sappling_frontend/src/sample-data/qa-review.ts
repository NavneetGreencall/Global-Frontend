/* =====================================================================
   Sample data for the Qa Review page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   Not shown by default: like the live app, this page starts empty.
   Pass these in to preview a filled page, e.g. <Page reports={SAMPLE_REPORTS} />.
   ===================================================================== */

import type { QaItem } from "@/pages/qa-review/QaReviewPage";

export const SAMPLE_QA: QaItem[] = [
  { id: "SG-20260922-B4C5D6", candidate: "Rohit Mehra", client: "Nikhil Tech", risk: "high", reviewer: null, hoursAtGate: 5, dueMinutes: 300, discrepancies: 2 },
  { id: "SG-20260921-C7D8E9", candidate: "Priya Nair", client: "Vision India Pvt Limited.", risk: "medium", reviewer: "Verification Specialist", hoursAtGate: 20, dueMinutes: -90, discrepancies: 1 },
];
