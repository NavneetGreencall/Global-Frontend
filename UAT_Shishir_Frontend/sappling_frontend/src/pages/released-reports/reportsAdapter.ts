import type { PublishedReportSummary } from "@/lib/backend-api/reports";
import type { ReleasedReport } from "./ReleasedReportsPage";

/* =====================================================================
   Converts listPublishedReports() items into Released reports rows.
   The API gives case number, candidate and dates; client, package,
   check count and verdict aren't provided, so they show "—".
   ===================================================================== */

export function toReleasedReport(r: PublishedReportSummary): ReleasedReport {
  return {
    id: r.id,
    caseId: r.case.caseNumber,
    candidate: r.case.subject.fullName,
    client: "—",
    pkg: "—",
    checks: null,
    verdict: null,
    releasedAt: r.publishedAt ?? r.case.completedAt ?? new Date().toISOString(),
    fileUrl: "",
  };
}
