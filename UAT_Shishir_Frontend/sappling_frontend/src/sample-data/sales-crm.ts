/* =====================================================================
   Sample data for the Sales Crm page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { FollowUp, SalesKpi, Trend } from "@/pages/sales-crm/SalesCrmPage";

export const MONTHS: string[] = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

export const KPIS: SalesKpi[] = [
  { id: "pipeline", label: "Open pipeline", value: 0, delta: 100, series: [0, 0, 0, 0, 0, 0], cls: "is-brand", format: "inr" },
  { id: "weighted", label: "Weighted forecast", value: 0, delta: 100, series: [0, 0, 0, 0, 0, 0], cls: "is-orange", format: "inr" },
  { id: "won", label: "Closed won", value: 503000, delta: 100, series: [0, 0, 0, 0, 0, 503000], cls: "is-teal", format: "inr" },
  { id: "winrate", label: "Win rate", value: 100, delta: 100, series: [0, 0, 0, 0, 0, 100], cls: "is-violet", format: "pct" },
];

export const FOLLOWUPS: FollowUp[] = [
  { id: "pending", label: "Pending follow-ups", value: 0, tone: "green", icon: "clock", href: "/admin/sales/follow-ups" },
  { id: "overdue", label: "Overdue follow-ups", value: 0, tone: "red", icon: "alert", href: "/admin/sales/follow-ups?filter=overdue" },
  { id: "unassigned", label: "Unassigned opportunities", value: 0, tone: "teal", icon: "user", href: "/admin/sales/opportunities?filter=unassigned" },
];

// Monthly values for the revenue trend tabs
export const TREND: Trend = {
  pipeline: [0, 0, 0, 0, 0, 503000],
  weighted: [0, 0, 0, 0, 0, 0],
  won: [0, 0, 0, 0, 0, 503000],
};
