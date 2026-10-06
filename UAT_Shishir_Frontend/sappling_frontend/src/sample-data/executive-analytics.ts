/* =====================================================================
   Sample data for the Executive Analytics page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { CheckRow, DailyPoint, Outcome, OutlookTile, OwnerRow, PerformanceRow, SlaSummary, TurnaroundSummary } from "@/pages/executive-analytics/ExecutiveAnalyticsPage";

/** Builds the sample daily intake/completion series */
const buildDays = (): DailyPoint[] => {
  const intake: Record<number, number> = { 7: 2, 8: 2, 11: 1, 12: 1, 13: 1, 15: 1, 24: 1, 26: 1 };
  const done: Record<number, number> = { 8: 1 };
  const out: DailyPoint[] = [];
  const start = new Date(2026, 7, 31);
  for (let i = 0; i < 29; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.getMonth() === 8 ? d.getDate() : -1;
    out.push({
      date: d,
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      intake: intake[key] ?? 0,
      completed: done[key] ?? 0,
    });
  }
  return out;
};

export const DAILY = buildDays();

// Set a target (e.g. target: 95) to show it on the card
export const SLA: SlaSummary = { value: 100, measured: 1, target: null, lastPoint: "08 Sept" };

export const TURNAROUND: TurnaroundSummary = { value: 2.6, unit: "h", measured: 1, lastPoint: "08 Sept", target: null };

export const OUTCOMES: Outcome[] = [
  { label: "Unclassified", value: 6, color: "#64748b" },
  { label: "Low", value: 4, color: "#22a65a" },
  { label: "Medium", value: 1, color: "#f08a24" },
  { label: "High", value: 0, color: "#d64545" },
];

export const CLIENTS: PerformanceRow[] = [
  { name: "Acme Tech Solutions", volume: 3, sla: null, tat: null, overdue: 100 },
  { name: "Acme India", volume: 2, sla: null, tat: null, overdue: 100 },
  { name: "Vision India Pvt Limited.", volume: 2, sla: null, tat: null, overdue: 100 },
  { name: "Nikhil Tech", volume: 2, sla: 100, tat: 2.6, overdue: 50 },
  { name: "IRFC", volume: 1, sla: null, tat: null, overdue: 100 },
  { name: "Navneet Kirana", volume: 1, sla: null, tat: null, overdue: 100 },
];

// Branch values are derived from the client table (single branch in scope)
export const BRANCHES: PerformanceRow[] = [{ name: "Head Office", volume: 11, sla: 100, tat: 2.6, overdue: 90.9 }];

export const CHECKS: CheckRow[] = [
  { type: "Employment", volume: 11, discrepancy: 55.0, tat: 9.1, color: "#1f9d55" },
  { type: "Education", volume: 11, discrepancy: 55.0, tat: 8.7, color: "#2b7fd4" },
  { type: "Criminal", volume: 2, discrepancy: 50.0, tat: 0.6, color: "#7c4ddb" },
  { type: "Reference", volume: 2, discrepancy: 50.0, tat: 0.5, color: "#f08a24" },
];

export const OWNERS: OwnerRow[] = [{ name: "Unassigned", open: 10, overdue: 10, completed: 1 }];

export const OUTLOOK: OutlookTile[] = [
  { label: "Due next 7 days", value: 0, tone: "blue", icon: "calendar" },
  { label: "At risk next 7 days", value: 6, tone: "orange", icon: "alert" },
  { label: "Projected completions", value: 0, tone: "green", icon: "check" },
  { label: "Unassigned active", value: 10, tone: "violet", icon: "user" },
];
