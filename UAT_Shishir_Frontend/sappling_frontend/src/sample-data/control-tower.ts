/* =====================================================================
   Sample data for the Control Tower page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { MonthValue, QueueItem, Results, Revenue, Signal, Stage } from "@/pages/control-tower/ControlTowerPage";

export const STAGES: Stage[] = [
  { id: "intake", name: "Case intake", count: 0, state: "clear", oldestHours: 0, atRisk: 0 },
  { id: "consent", name: "Consent", count: 3, state: "waiting", oldestHours: 719, atRisk: 3 },
  { id: "documents", name: "Documents", count: 3, state: "waiting", oldestHours: 523, atRisk: 3 },
  { id: "verification", name: "Verification", count: 7, state: "moving", oldestHours: 692, atRisk: 7 },
  { id: "clarification", name: "Clarification", count: 0, state: "clear", oldestHours: 0, atRisk: 0 },
  { id: "qa", name: "QA review", count: 2, state: "moving", oldestHours: 473, atRisk: 2 },
  { id: "manager_review", name: "Manager approval", count: 0, state: "clear", oldestHours: 0, atRisk: 0 },
  { id: "report", name: "Report preparation", count: 0, state: "clear", oldestHours: 0, atRisk: 0 },
  { id: "payment", name: "Payment & release", count: 0, state: "clear", oldestHours: 0, atRisk: 0 },
  { id: "completed", name: "Completed", count: 1, state: "closed", oldestHours: 500, atRisk: 0 },
];

export const QUEUE: QueueItem[] = [
  {
    id: "SG-20260830-6B1CF5",
    candidate: "Harsh Singh",
    stageId: "consent",
    client: "Acme India",
    waitingHours: 719,
    due: "02 Sept, 12:19 pm",
    critical: true,
    note: "SLA overdue",
    owner: null,
  },
  {
    id: "SG-20260831-D90636",
    candidate: "Avneet",
    stageId: "consent",
    client: "Client name",
    waitingHours: 696,
    due: "01 Sept, 11:36 am",
    critical: true,
    note: "SLA overdue, urgent priority",
    owner: null,
  },
];

export const SIGNALS: Signal[] = [
  { id: "client", label: "Client action required", value: 0, href: "/admin/cases?filter=client", icon: "inbox", tone: "amber" },
  { id: "completed", label: "Completed today", value: 0, href: "/admin/reports", icon: "check", tone: "teal" },
  { id: "exceptions", label: "Critical exceptions", value: 9, href: "/admin/exceptions", icon: "alert", tone: "red" },
];

// Invoices created in the last 12 months, current balances
export const REVENUE: Revenue = {
  received: 16520,
  rows: [
    { label: "Billed", value: 16520, tone: "blue" },
    { label: "Payment received", value: 16520, tone: "green" },
    { label: "Payment pending", value: 0, tone: "amber" },
    { label: "Overdue payment", value: 0, tone: "red" },
  ],
};

// Checks on cases initiated in the last 12 months
export const RESULTS: Results = { total: 70, pending: 44, clear: 26 };

// Replace with real monthly counts
export const INTAKE: MonthValue[] = [
  { month: "Apr", value: 4 },
  { month: "May", value: 4 },
  { month: "Jun", value: 4 },
  { month: "Jul", value: 4 },
  { month: "Aug", value: 9 },
  { month: "Sep", value: 15 },
];
