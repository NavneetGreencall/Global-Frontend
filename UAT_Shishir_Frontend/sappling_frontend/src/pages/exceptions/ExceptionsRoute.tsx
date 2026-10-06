import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Exceptions from "./ExceptionsPage";
import { toExceptionItems, toExceptionStats } from "./exceptionsAdapter";
import { PageError, PageLoading } from "@/components/ui";
import { getExceptionsDashboard } from "@/lib/backend-api/dashboards";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Exceptions: connects the page to getExceptionsDashboard().
   The API has no "resolve" or "reassign" for these items, so both buttons
   open the case in the Cases register, where the work is done.
   ===================================================================== */

const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

function LiveExceptions() {
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["dashboards", "exceptions"], queryFn: getExceptionsDashboard });

  if (q.isError && !q.data) return <PageError message={messageOf(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data) return <PageLoading label="Loading exceptions…" />;

  const items = toExceptionItems(q.data);
  const caseNumberOf = new Map(items.map((x) => [x.id, x.caseId]));
  const openCase = (id: string) => navigate(`/admin/cases?search=${encodeURIComponent(caseNumberOf.get(id) ?? "")}`);

  return <Exceptions stats={toExceptionStats(q.data)} items={items} onResolve={openCase} onAssign={openCase} />;
}

export default function ExceptionsRoute() {
  return USE_SAMPLE_DATA ? <Exceptions /> : <LiveExceptions />;
}
