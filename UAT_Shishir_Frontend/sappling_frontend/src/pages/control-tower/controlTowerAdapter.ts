import type { CaseListItem } from "@/lib/backend-api/cases";
import type { ExecutiveDashboard, OperationsDashboard } from "@/lib/backend-api/dashboards";
import type { FinanceOverview } from "@/lib/backend-api/finance";
import type { MonthValue, QueueItem, Revenue, Results, Signal, Stage } from "./ControlTowerPage";

/* =====================================================================
   Converts dashboards.ts / cases.ts / finance.ts data into what the
   Control Tower shows. Anything the API doesn't provide shows "—".
   ===================================================================== */

/** "DOCUMENTS_PENDING" → "Documents pending" */
export const labelOf = (status: string) =>
  status.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const CLOSED = ["COMPLETED", "CLOSED", "CANCELLED", "RELEASED", "REPORT_RELEASED"];

export function toStages(d: OperationsDashboard): Stage[] {
  return (d.stageHealth ?? []).map((s) => ({
    id: s.status.toLowerCase(),
    name: labelOf(s.status),
    count: s.count,
    state: CLOSED.includes(s.status.toUpperCase()) ? "closed" : s.count === 0 ? "clear" : s.atRisk > 0 ? "waiting" : "moving",
    oldestHours: Math.round(s.oldestAgeHours),
    atRisk: s.atRisk,
  }));
}

const hoursSince = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000));

function dueText(dueAt?: string | null): string {
  if (!dueAt) return "—";
  const h = Math.round((new Date(dueAt).getTime() - Date.now()) / 3_600_000);
  const span = (x: number) => (Math.abs(x) >= 24 ? `${Math.floor(Math.abs(x) / 24)}d ${Math.abs(x) % 24}h` : `${Math.abs(x)}h`);
  return h < 0 ? `Overdue by ${span(h)}` : `Due in ${span(h)}`;
}

export function toQueue(cases: CaseListItem[]): QueueItem[] {
  return cases.map((c) => ({
    id: c.caseNumber,
    candidate: c.subject.fullName,
    stageId: c.status.toLowerCase(),
    client: c.client.displayName,
    waitingHours: hoursSince(c.updatedAt),
    due: dueText(c.dueAt),
    critical: ["URGENT", "CRITICAL"].includes(c.priority.toUpperCase()),
    note: c.riskLevel ? `Risk: ${labelOf(c.riskLevel)}` : "",
    owner: c.assignedOpsUser?.displayName ?? null,
  }));
}

export function toSignals(ops: OperationsDashboard, clientActions: number | null, criticalExceptions: number | null): Signal[] {
  return [
    { id: "client", label: "Client action required", value: clientActions ?? 0, href: "/admin/client-portal", icon: "inbox", tone: "amber" },
    { id: "completed", label: "Completed today", value: ops.summary.completedToday, href: "/admin/reports", icon: "check", tone: "teal" },
    { id: "exceptions", label: "Critical exceptions", value: criticalExceptions ?? 0, href: "/admin/exceptions", icon: "alert", tone: "red" },
  ];
}

export function toRevenue(f: FinanceOverview): Revenue {
  return {
    received: f.summary.collected,
    rows: [
      { label: "Billed", value: f.summary.billed, tone: "blue" },
      { label: "Payment received", value: f.summary.collected, tone: "green" },
      { label: "Payment pending", value: f.summary.outstanding, tone: "amber" },
      { label: "Overdue payment", value: f.summary.overdueAmount, tone: "red" },
    ],
  };
}

/** outcomeMix keys vary (e.g. CLEAR, PENDING); match them without caring about case */
export function toResults(outcomeMix: Record<string, number>): Results {
  const get = (...names: string[]) =>
    Object.entries(outcomeMix).filter(([k]) => names.includes(k.toUpperCase())).reduce((n, [, v]) => n + v, 0);
  const total = Object.values(outcomeMix).reduce((n, v) => n + v, 0);
  return { total, clear: get("CLEAR"), pending: get("PENDING", "RESULT_PENDING", "UNCLASSIFIED", "IN_PROGRESS") };
}

export function toIntake(d: OperationsDashboard): MonthValue[] {
  return d.trend.map((t) => ({
    month: new Date(t.month.length === 7 ? `${t.month}-01` : t.month).toLocaleString("en-IN", { month: "short" }),
    value: t.created,
  }));
}

/** SLA % and average completion from the executive dashboard, or null/"—" */
export function toPerformance(e: ExecutiveDashboard | undefined) {
  const p = e?.performance;
  return {
    sla: p?.slaPercentage == null ? null : Math.round(p.slaPercentage),
    avgCompletion: p?.averageTatHours == null ? "—" : `${Math.round(p.averageTatHours * 10) / 10}h`,
  };
}
