import { useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import ExecutiveAnalytics from "./ExecutiveAnalyticsPage";
import type { AnalyticsFilters } from "./ExecutiveAnalyticsPage";
import {
  toApiFilters, toChecks, toDaily, toOutcomes, toOutlook, toOwners, toPerformanceRows, toSla, toTurnaround,
} from "./analyticsAdapter";
import { PageError, PageLoading, useFeedback } from "@/components/ui";
import { exportExecutiveDashboard, getExecutiveDashboard } from "@/lib/backend-api/dashboards";
import type { ExecutiveDashboard } from "@/lib/backend-api/dashboards";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Executive Analytics: connects the page to getExecutiveDashboard().
   The client and time-range filters reload the dashboard from the API;
   "Export" downloads it as CSV through exportExecutiveDashboard().
   ===================================================================== */

const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

function LiveExecutiveAnalytics() {
  const [filters, setFilters] = useState<AnalyticsFilters>({ client: "all", range: "30" });
  const { toast } = useFeedback();
  const last = useRef<ExecutiveDashboard | undefined>(undefined);
  const apiFilters = toApiFilters(filters, last.current);

  const q = useQuery({
    queryKey: ["dashboards", "executive", apiFilters],
    queryFn: () => getExecutiveDashboard(apiFilters),
    placeholderData: keepPreviousData,
  });
  if (q.data) last.current = q.data;

  if (q.isError && !q.data) return <PageError message={messageOf(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data) return <PageLoading label="Loading analytics…" />;

  const d = q.data;
  return (
    <ExecutiveAnalytics
      daily={toDaily(d)}
      sla={toSla(d)}
      turnaround={toTurnaround(d)}
      outcomes={toOutcomes(d)}
      clients={toPerformanceRows(d.clientPerformance)}
      branches={toPerformanceRows(d.branchPerformance)}
      checks={toChecks(d)}
      owners={toOwners(d)}
      outlook={toOutlook(d)}
      onFilterChange={setFilters}
      onExport={() => {
        exportExecutiveDashboard("csv", apiFilters).then(() => toast("Analytics exported"), (err) => toast(`Couldn't export: ${messageOf(err)}`, "error"));
      }}
    />
  );
}

export default function ExecutiveAnalyticsRoute() {
  return USE_SAMPLE_DATA ? <ExecutiveAnalytics /> : <LiveExecutiveAnalytics />;
}
