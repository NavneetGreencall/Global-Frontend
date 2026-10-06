import { useQuery } from "@tanstack/react-query";
import FinanceBilling from "./FinanceBillingPage";
import { toFinanceTotals, toReceivables } from "./financeAdapter";
import { PageError, PageLoading, useFeedback } from "@/components/ui";
import { exportFinanceLedger, getFinanceOverview, listInvoices } from "@/lib/backend-api/finance";
import type { Invoice } from "@/lib/backend-api/finance";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Finance & Billing: connects the page to finance.ts.
   - Totals:       getFinanceOverview()
   - Receivables:  open invoices from listInvoices() (up to MAX_INVOICES)
   - "Monthly statement" downloads the ledger: exportFinanceLedger()
   ===================================================================== */

const MAX_INVOICES = 200; // receivables list reads at most this many invoices
const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

/** listInvoices sends invoices in chunks (cursor); read them up to a limit */
async function loadInvoices(): Promise<Invoice[]> {
  const all: Invoice[] = [];
  let cursor: string | undefined;
  do {
    const page = await listInvoices({ cursor, limit: 50 });
    all.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor && all.length < MAX_INVOICES);
  return all;
}

function LiveFinanceBilling() {
  const { toast } = useFeedback();
  const overview = useQuery({ queryKey: ["finance", "overview"], queryFn: getFinanceOverview });
  const invoices = useQuery({ queryKey: ["finance", "invoices"], queryFn: loadInvoices });

  if (overview.isError && !overview.data) return <PageError message={messageOf(overview.error)} onRetry={() => overview.refetch()} />;
  if (!overview.data) return <PageLoading label="Loading finance…" />;

  return (
    <FinanceBilling
      totals={toFinanceTotals(overview.data)}
      receivables={invoices.data ? toReceivables(invoices.data) : []}
      snapshotAt={overview.data.generatedAt}
      onStatement={() => {
        exportFinanceLedger().then(() => toast("Ledger downloaded"), (err) => toast(`Couldn't download the ledger: ${messageOf(err)}`, "error"));
      }}
    />
  );
}

export default function FinanceBillingRoute() {
  return USE_SAMPLE_DATA ? <FinanceBilling /> : <LiveFinanceBilling />;
}
