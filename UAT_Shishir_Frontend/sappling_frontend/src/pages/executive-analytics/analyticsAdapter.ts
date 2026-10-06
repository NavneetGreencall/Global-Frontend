import type { ExecutiveDashboard, ExecutiveDashboardFilters } from "@/lib/backend-api/dashboards";
import type {
  AnalyticsFilters, CheckRow, DailyPoint, Outcome, OutlookTile, OwnerRow, PerformanceRow, SlaSummary, TurnaroundSummary,
} from "./ExecutiveAnalyticsPage";

/* =====================================================================
   Converts getExecutiveDashboard() into what Executive Analytics shows.
   The API trend is monthly, so the intake chart shows one point per month.
   Missing figures show "—" (the page shows null SLA / TAT as "—").
   ===================================================================== */

const labelOf = (s: string) => s.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const monthDate = (m: string) => new Date(m.length === 7 ? `${m}-01` : m);
const round1 = (n: number | null | undefined) => (n == null ? null : Math.round(n * 10) / 10);

/** Page range ("7", "30", "90", "365" days) → API months (+ from/to for short ranges) */
export function toApiFilters(f: AnalyticsFilters, d?: ExecutiveDashboard): ExecutiveDashboardFilters {
  const days = Number(f.range) || 30;
  const out: ExecutiveDashboardFilters = { months: days >= 365 ? 12 : days >= 90 ? 3 : 1 };
  if (days < 30) {
    const to = new Date();
    const from = new Date(Date.now() - days * 86_400_000);
    out.from = from.toISOString().slice(0, 10);
    out.to = to.toISOString().slice(0, 10);
  }
  if (f.client !== "all") {
    const match = d?.filters.clients.find((c) => c.displayName === f.client);
    if (match) out.clientId = match.publicId;
  }
  return out;
}

export function toDaily(d: ExecutiveDashboard): DailyPoint[] {
  return d.trend.map((t) => {
    const date = monthDate(t.month);
    return { date, label: date.toLocaleString("en-IN", { month: "short", year: "2-digit" }), intake: t.created, completed: t.completed };
  });
}

export function toSla(d: ExecutiveDashboard): SlaSummary {
  const last = d.performanceTrend[d.performanceTrend.length - 1];
  return {
    value: round1(d.performance.slaPercentage),
    measured: d.performance.completedCases,
    target: null,
    lastPoint: last ? monthDate(last.month).toLocaleString("en-IN", { month: "short", year: "numeric" }) : "—",
  };
}

export function toTurnaround(d: ExecutiveDashboard): TurnaroundSummary {
  const last = d.performanceTrend[d.performanceTrend.length - 1];
  return {
    value: round1(d.performance.averageTatHours),
    unit: "h",
    measured: d.performance.completedCases,
    lastPoint: last ? monthDate(last.month).toLocaleString("en-IN", { month: "short", year: "numeric" }) : "—",
    target: null,
  };
}

const RISK_COLOURS: Record<string, string> = { LOW: "#22a65a", MEDIUM: "#f08a24", HIGH: "#d64545", CRITICAL: "#a61b1b" };

export function toOutcomes(d: ExecutiveDashboard): Outcome[] {
  return Object.entries(d.riskMix).map(([k, v]) => ({ label: labelOf(k), value: v, color: RISK_COLOURS[k.toUpperCase()] ?? "#64748b" }));
}

export function toPerformanceRows(rows: ExecutiveDashboard["clientPerformance"]): PerformanceRow[] {
  return rows.map((r) => ({ name: r.name, volume: r.total, sla: round1(r.slaPercentage), tat: round1(r.averageTatHours), overdue: r.overdue }));
}

const PALETTE = ["#1f9d55", "#2b7fd4", "#7c4ddb", "#f08a24", "#17a2a0", "#d64545", "#64748b"];

export function toChecks(d: ExecutiveDashboard): CheckRow[] {
  return d.checkPerformance.map((c, i) => ({
    type: labelOf(c.type),
    volume: c.total,
    discrepancy: c.completed ? Math.round((c.discrepancies / c.completed) * 1000) / 10 : 0,
    tat: round1(c.averageTatHours) ?? 0,
    color: PALETTE[i % PALETTE.length],
  }));
}

export function toOwners(d: ExecutiveDashboard): OwnerRow[] {
  return d.teamCapacity.map((t) => ({ name: t.name, open: t.active, overdue: t.overdue, completed: t.completed }));
}

export function toOutlook(d: ExecutiveDashboard): OutlookTile[] {
  return [
    { label: "Due next 7 days", value: d.forecast.dueNext7Days, tone: "blue", icon: "calendar" },
    { label: "At risk next 7 days", value: d.forecast.atRiskNext7Days, tone: "orange", icon: "alert" },
    { label: "Projected completions", value: d.forecast.projectedCompletions7Days, tone: "green", icon: "check" },
    { label: "Unassigned active", value: d.forecast.unassignedActive, tone: "violet", icon: "user" },
  ];
}
