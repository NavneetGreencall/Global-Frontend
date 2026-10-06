import { useQuery } from "@tanstack/react-query";
import FieldOperations from "./FieldOperationsPage";
import { toFieldStats, toFieldVisits } from "./fieldAdapter";
import { PageError, PageLoading } from "@/components/ui";
import { getExceptionsDashboard } from "@/lib/backend-api/dashboards";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Field Operations: connects the page to getExceptionsDashboard().fieldVisits
   (visits recorded outside the allowed distance, waiting for review).
   ===================================================================== */

const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

function LiveFieldOperations() {
  const q = useQuery({ queryKey: ["dashboards", "exceptions"], queryFn: getExceptionsDashboard });
  if (q.isError && !q.data) return <PageError message={messageOf(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data) return <PageLoading label="Loading field visits…" />;
  return <FieldOperations stats={toFieldStats(q.data)} visits={toFieldVisits(q.data)} />;
}

export default function FieldOperationsRoute() {
  return USE_SAMPLE_DATA ? <FieldOperations /> : <LiveFieldOperations />;
}
