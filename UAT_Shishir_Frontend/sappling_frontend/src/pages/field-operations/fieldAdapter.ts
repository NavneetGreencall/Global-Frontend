import type { ExceptionsDashboard } from "@/lib/backend-api/dashboards";
import type { FieldStats, FieldVisit } from "./FieldOperationsPage";

/* =====================================================================
   Converts getExceptionsDashboard().fieldVisits into Field Operations.
   The API lists the visits that need review (outside the geofence);
   a list of every visit isn't available, so other figures show "—".
   ===================================================================== */

export function toFieldVisits(d: ExceptionsDashboard): FieldVisit[] {
  return d.fieldVisits.map((v) => ({
    id: v.id,
    caseId: v.case.caseNumber,
    candidate: v.case.subject.fullName,
    client: v.case.client.displayName,
    status: "outside",
    executive: v.assignee?.displayName ?? "—",
    location: v.address,
    distanceM: v.distanceMeters ?? null,
    allowedM: v.geofenceMeters,
    recorded: v.capturedAt ?? v.createdAt,
  }));
}

export function toFieldStats(d: ExceptionsDashboard): FieldStats {
  return {
    activityToday: null,
    evidencePending: null,
    outsideGeofence: d.summary.fieldExceptions,
    reviewEvidence: null,
    reviewExceptions: d.summary.fieldExceptions,
  };
}
