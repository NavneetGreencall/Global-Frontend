import { useQuery } from "@tanstack/react-query";
import SalesCRM from "./SalesCrmPage";
import { toFollowUps, toKpis, toMonths, toTrend } from "./salesAdapter";
import { PageError, PageLoading, useFeedback } from "@/components/ui";
import { getCrmOverview } from "@/lib/backend-api/crm";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Sales & CRM: connects the page to getCrmOverview().
   The overview covers a fixed period, so the range buttons don't reload it.
   ===================================================================== */

const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

function LiveSalesCRM() {
  const { toast } = useFeedback();
  const q = useQuery({ queryKey: ["crm", "overview"], queryFn: getCrmOverview });
  if (q.isError && !q.data) return <PageError message={messageOf(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data) return <PageLoading label="Loading sales…" />;
  return (
    <SalesCRM
      kpis={toKpis(q.data)}
      followUps={toFollowUps(q.data)}
      trend={toTrend(q.data)}
      months={toMonths(q.data)}
      onNewOpportunity={() => toast("Creating opportunities isn't available in this dashboard yet. Use the existing CRM screen for now.", "info")}
    />
  );
}

export default function SalesCrmRoute() {
  return USE_SAMPLE_DATA ? <SalesCRM /> : <LiveSalesCRM />;
}
