import type { FinanceOverview, Invoice } from "@/lib/backend-api/finance";
import type { FinanceTotals, Receivable } from "./FinanceBillingPage";

/* =====================================================================
   Converts finance.ts data into what the Finance & Billing page shows.
   ===================================================================== */

const num = (v: string | number | null | undefined) => (v == null ? 0 : Number(v) || 0);

export function toFinanceTotals(o: FinanceOverview): FinanceTotals {
  return {
    billed: o.summary.billed,
    invoices: o.summary.invoiceCount,
    collected: o.summary.collected,
    outstanding: o.summary.outstanding,
    openInvoices: o.summary.openInvoiceCount,
    overdue: o.summary.overdueAmount,
    overdueInvoices: o.summary.overdueCount,
  };
}

/** Balance still to collect on an invoice */
export const balanceOf = (inv: Invoice) => num(inv.totalAmount) - num(inv.paidAmount) - num(inv.creditedAmount);

/** Open invoices (balance above zero) become receivables, aged from the issue date */
export function toReceivables(invoices: Invoice[]): Receivable[] {
  return invoices
    .filter((inv) => balanceOf(inv) > 0.005 && inv.status.toUpperCase() !== "CANCELLED")
    .map((inv) => {
      const since = inv.issuedAt ?? inv.dueAt;
      const client = (inv as unknown as { client?: { displayName?: string } }).client?.displayName;
      return {
        id: inv.invoiceNumber,
        client: client ?? "—", // shown as "—" if the invoice list doesn't include the client
        amount: balanceOf(inv),
        daysOutstanding: since ? Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000)) : 0,
      };
    });
}
