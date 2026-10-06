import type { ExceptionsDashboard, OperationsDashboard } from "@/lib/backend-api/dashboards";
import type { ClientResponse, PortfolioStage, PortfolioStats } from "./ClientPortfolioPage";

/* =====================================================================
   Client Portfolio from two dashboards:
   - getOperationsDashboard(): totals and statusMix (stage mix)
   - getExceptionsDashboard(): clarifications waiting on clients
   ===================================================================== */

const DONE = ["COMPLETED", "CLOSED", "RELEASED", "REPORT_RELEASED", "CANCELLED"];
const PALETTE = ["#e0a015", "#f08a24", "#2b7fd4", "#7552e0", "#17a2a0", "#d64545", "#64748b"];
const labelOf = (s: string) => s.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export function toStages(ops: OperationsDashboard): PortfolioStage[] {
  return Object.entries(ops.statusMix).map(([status, count], i) => {
    const done = DONE.includes(status.toUpperCase());
    return { id: status.toLowerCase(), label: labelOf(status), count, color: done ? "#22a65a" : PALETTE[i % PALETTE.length], casesStage: status.toLowerCase(), done };
  });
}

export function toStats(ops: OperationsDashboard, exc: ExceptionsDashboard | undefined): PortfolioStats {
  const completed = Object.entries(ops.statusMix).filter(([s]) => DONE.includes(s.toUpperCase())).reduce((n, [, v]) => n + v, 0);
  return {
    activePortfolio: Math.max(0, ops.summary.total - completed),
    openClarifications: exc?.summary.clarifications ?? 0,
    overdueCases: ops.summary.overdue,
    completed,
    completedToday: ops.summary.completedToday,
  };
}

/** clarifications grouped by client: how many are open and how long the oldest has waited */
export function toResponses(exc: ExceptionsDashboard | undefined): ClientResponse[] {
  if (!exc) return [];
  const byClient = new Map<string, ClientResponse>();
  for (const c of exc.clarifications) {
    const name = c.case.client.displayName;
    const hours = Math.max(0, Math.round((Date.now() - new Date(c.createdAt).getTime()) / 3_600_000));
    const row = byClient.get(name) ?? { client: name, open: 0, oldestHours: 0 };
    row.open += 1;
    row.oldestHours = Math.max(row.oldestHours, hours);
    byClient.set(name, row);
  }
  return [...byClient.values()];
}
