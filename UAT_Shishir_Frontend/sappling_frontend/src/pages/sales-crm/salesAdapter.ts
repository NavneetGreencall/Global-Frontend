import type { CrmOverview } from "@/lib/backend-api/crm";
import type { FollowUp, SalesKpi, Trend } from "./SalesCrmPage";

/* =====================================================================
   Converts getCrmOverview() into what the Sales & CRM page shows.
   ===================================================================== */

/** % change between the last two months of a series (0 if there's no earlier value) */
const deltaOf = (series: number[]) => {
  const [prev, last] = series.slice(-2);
  if (prev === undefined || last === undefined || prev === 0) return last ? 100 : 0;
  return Math.round(((last - prev) / Math.abs(prev)) * 100);
};

/** win rate may arrive as 0–1 or 0–100 */
const pct = (v: number) => (v <= 1 ? Math.round(v * 1000) / 10 : Math.round(v * 10) / 10);

export function toKpis(o: CrmOverview): SalesKpi[] {
  const pipeline = o.trend.map((t) => t.pipelineValue);
  const weighted = o.trend.map((t) => t.weightedValue);
  const won = o.trend.map((t) => t.wonValue);
  const winRate = o.trend.map((t) => pct(t.winRate));
  return [
    { id: "pipeline", label: "Open pipeline", value: o.summary.openValue, delta: deltaOf(pipeline), series: pipeline, cls: "is-brand", format: "inr" },
    { id: "weighted", label: "Weighted forecast", value: o.summary.weightedValue, delta: deltaOf(weighted), series: weighted, cls: "is-orange", format: "inr" },
    { id: "won", label: "Closed won", value: o.summary.wonValue, delta: deltaOf(won), series: won, cls: "is-teal", format: "inr" },
    { id: "winrate", label: "Win rate", value: pct(o.summary.winRate), delta: deltaOf(winRate), series: winRate, cls: "is-violet", format: "pct" },
  ];
}

export function toFollowUps(o: CrmOverview): FollowUp[] {
  return [
    { id: "pending", label: "Pending follow-ups", value: o.summary.pendingFollowUps, tone: "green", icon: "clock", href: "/admin/sales/follow-ups" },
    { id: "overdue", label: "Overdue follow-ups", value: o.summary.overdueFollowUps, tone: "red", icon: "alert", href: "/admin/sales/follow-ups?filter=overdue" },
    { id: "unassigned", label: "Unassigned opportunities", value: o.summary.unassignedOpportunities, tone: "teal", icon: "user", href: "/admin/sales/opportunities?filter=unassigned" },
  ];
}

export function toTrend(o: CrmOverview): Trend {
  return {
    pipeline: o.trend.map((t) => t.pipelineValue),
    weighted: o.trend.map((t) => t.weightedValue),
    won: o.trend.map((t) => t.wonValue),
  };
}

export const toMonths = (o: CrmOverview) =>
  o.trend.map((t) => new Date(t.month.length === 7 ? `${t.month}-01` : t.month).toLocaleString("en-IN", { month: "short" }));
