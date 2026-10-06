/* =====================================================================
   Sample data for the Finance Billing page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { FinanceTotals, Receivable } from "@/pages/finance-billing/FinanceBillingPage";

export const TOTALS: FinanceTotals = {
  billed: 16520,
  invoices: 1,
  collected: 16520,
  outstanding: 0,
  openInvoices: 0,
  overdue: 0,
  overdueInvoices: 0,
};

export const RECEIVABLES: Receivable[] = [];
