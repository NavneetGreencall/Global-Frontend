import { useQuery } from "@tanstack/react-query";
import ClientPortfolio from "./ClientPortfolioPage";
import { toResponses, toStages, toStats } from "./portfolioAdapter";
import { PageError, PageLoading } from "@/components/ui";
import { getExceptionsDashboard, getOperationsDashboard } from "@/lib/backend-api/dashboards";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Client Portfolio: operations dashboard (stages, totals) plus
   exceptions dashboard (client clarifications). Only the operations
   dashboard is required; if clarifications fail, that panel is empty.
   ===================================================================== */

const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

function LiveClientPortfolio() {
  const ops = useQuery({ queryKey: ["dashboards", "operations"], queryFn: getOperationsDashboard });
  const exc = useQuery({ queryKey: ["dashboards", "exceptions"], queryFn: getExceptionsDashboard });
  if (ops.isError && !ops.data) return <PageError message={messageOf(ops.error)} onRetry={() => ops.refetch()} />;
  if (!ops.data) return <PageLoading label="Loading client portfolio…" />;
  return <ClientPortfolio stats={toStats(ops.data, exc.data)} stages={toStages(ops.data)} responses={toResponses(exc.data)} />;
}

export default function ClientPortfolioRoute() {
  return USE_SAMPLE_DATA ? <ClientPortfolio /> : <LiveClientPortfolio />;
}
