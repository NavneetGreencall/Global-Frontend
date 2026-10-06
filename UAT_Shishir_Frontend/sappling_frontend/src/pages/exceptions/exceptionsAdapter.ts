import type { ExceptionsDashboard } from "@/lib/backend-api/dashboards";
import type { ExceptionItem, ExceptionStats, Severity } from "./ExceptionsPage";

/* =====================================================================
   Converts getExceptionsDashboard() into the Exceptions page's queue.
   The API returns four lists; they become one queue with categories:
     overdue cases → "sla", clarifications → "clarification",
     field visits outside the geofence → "field", rejected documents → "documents"
   ===================================================================== */

const hoursSince = (iso?: string | null) =>
  iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000)) : 0;

/** Case priority → severity on the page */
export function severityOf(priority: string): Severity {
  const p = priority.toUpperCase();
  if (p === "URGENT" || p === "CRITICAL") return "critical";
  if (p === "HIGH") return "high";
  if (p === "LOW") return "low";
  return "medium";
}

export function toExceptionStats(d: ExceptionsDashboard): ExceptionStats {
  return {
    open: d.summary.total,
    uniqueCases: d.summary.uniqueCases,
    critical: d.summary.critical,
    avgAgeHours: Math.round(d.summary.averageAgeHours),
    resolvedToday: d.summary.resolvedToday,
  };
}

export function toExceptionItems(d: ExceptionsDashboard): ExceptionItem[] {
  const overdue: ExceptionItem[] = d.overdue.map((c) => ({
    id: `overdue-${c.id}`,
    caseId: c.caseNumber,
    candidate: c.subject.fullName,
    client: c.client.displayName,
    severity: severityOf(c.priority),
    category: "sla",
    overdue: true,
    issue: "Case is past its committed due date",
    owner: "—", // not provided by the API
    ageHours: hoursSince(c.dueAt),
  }));

  const clarifications: ExceptionItem[] = d.clarifications.map((c) => ({
    id: `clarification-${c.id}`,
    caseId: c.case.caseNumber,
    candidate: c.case.subject.fullName,
    client: c.case.client.displayName,
    severity: c.dueAt && new Date(c.dueAt).getTime() < Date.now() ? "high" : "medium",
    category: "clarification",
    overdue: Boolean(c.dueAt && new Date(c.dueAt).getTime() < Date.now()),
    issue: c.subject,
    owner: "Client",
    ageHours: hoursSince(c.createdAt),
  }));

  const field: ExceptionItem[] = d.fieldVisits.map((v) => ({
    id: `field-${v.id}`,
    caseId: v.case.caseNumber,
    candidate: v.case.subject.fullName,
    client: v.case.client.displayName,
    severity: "high",
    category: "field",
    overdue: false,
    issue:
      v.distanceMeters != null
        ? `Visit recorded ${Math.round(v.distanceMeters)} m from the address (allowed ${v.geofenceMeters} m)`
        : "Field visit needs review",
    owner: v.assignee?.displayName ?? "—",
    ageHours: hoursSince(v.capturedAt ?? v.createdAt),
  }));

  const documents: ExceptionItem[] = d.rejectedDocuments.map((doc) => ({
    id: `document-${doc.id}`,
    caseId: doc.case.caseNumber,
    candidate: doc.case.subject.fullName,
    client: doc.case.client.displayName,
    severity: "high",
    category: "documents",
    overdue: false,
    issue: `${doc.type.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())} document was rejected`,
    owner: "—",
    ageHours: hoursSince(doc.updatedAt),
  }));

  return [...overdue, ...clarifications, ...field, ...documents];
}
