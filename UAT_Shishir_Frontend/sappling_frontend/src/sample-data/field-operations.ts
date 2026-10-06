/* =====================================================================
   Sample data for the Field Operations page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { FieldStats, FieldVisit } from "@/pages/field-operations/FieldOperationsPage";

export const STATS: FieldStats = { activityToday: 0, evidencePending: 0, outsideGeofence: 0, reviewEvidence: 0, reviewExceptions: 0 };

export const VISITS: FieldVisit[] = [
  { id: "fv1", caseId: "SG-20260912-B04D70", candidate: "Ranjan", client: "Acme Tech Solutions", status: "completed", executive: "Field Executive", location: "A11 vision india", distanceM: 2, allowedM: 500, recorded: "2026-09-14T11:39:00+05:30" },
  { id: "fv2", caseId: "SG-20260912-A055C9", candidate: "RAMAN", client: "IRFC", status: "checked_in", executive: "Field Executive", location: "vision india services pvt.ltd A11", distanceM: null, allowedM: 50, recorded: "2026-09-14T10:13:00+05:30" },
  { id: "fv3", caseId: "SG-20260910-70F349", candidate: "Rani", client: "Vision India Pvt Limited.", status: "checked_in", executive: "field1", location: "A11 Vision INdia", distanceM: null, allowedM: 150, recorded: "2026-09-10T13:10:00+05:30" },
];
