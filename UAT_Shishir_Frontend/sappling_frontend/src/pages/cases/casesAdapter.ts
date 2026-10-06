import type { CaseListItem } from "@/lib/backend-api/cases";
import type { CaseRow, Priority } from "./CasesPage";

/* =====================================================================
   Converts listCases() items into rows for the Cases register.
   ===================================================================== */

/** API status → the register's stage keys */
export function stageOf(status: string): string {
  const s = status.toUpperCase();
  if (/COMPLETE|RELEASED|CLOSED/.test(s)) return "completed";
  if (/PAYMENT/.test(s)) return "payment";
  if (/REPORT/.test(s)) return "report";
  if (/MANAGER|APPROVAL/.test(s)) return "manager_review";
  if (/QA/.test(s)) return "qa";
  if (/CLARIF/.test(s)) return "clarification";
  if (/DOCUMENT/.test(s)) return "documents";
  if (/CONSENT/.test(s)) return "consent";
  if (/INTAKE|NEW|DRAFT|CREATED/.test(s)) return "intake";
  return "verification";
}

export function priorityOf(apiPriority: string): Priority {
  const p = apiPriority.toUpperCase();
  if (p === "URGENT" || p === "CRITICAL") return "critical";
  if (p === "HIGH") return "high";
  if (p === "LOW") return "low";
  return "medium";
}

/** Due date, or created + the package's turnaround hours when there is none */
function dueTime(c: CaseListItem): number {
  if (c.dueAt) return new Date(c.dueAt).getTime();
  const tat = c.servicePackage?.tatHours ?? 72;
  return new Date(c.createdAt).getTime() + tat * 3_600_000;
}

export function toCaseRow(c: CaseListItem): CaseRow {
  const done = c.checks.filter((k) => /COMPLETE|CLEAR|DONE|VERIFIED/i.test(k.status)).length;
  const pkg = c.services?.length ? c.services.map((s) => s.servicePackage.name).join(" + ") : c.servicePackage?.name ?? "—";
  return {
    id: c.caseNumber,
    candidate: c.subject.fullName,
    client: c.client.displayName,
    pkg,
    checks: c.checks.length,
    stage: stageOf(c.status),
    progress: stageOf(c.status) === "completed" ? 100 : c.checks.length ? Math.round((done / c.checks.length) * 100) : 0,
    priority: priorityOf(c.priority),
    slaMinutes: Math.round((dueTime(c) - Date.now()) / 60_000),
    owner: c.assignedOpsUser?.displayName ?? null,
    updated: c.updatedAt.slice(0, 10),
  };
}
