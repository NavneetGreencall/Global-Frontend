import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import VerifierOperations from "./VerifierOperationsPage";
import { toUnallocated, toVerifiers } from "./verifierAdapter";
import { PageError, PageLoading, useFeedback } from "@/components/ui";
import { getExecutiveDashboard } from "@/lib/backend-api/dashboards";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Verifier Operations: connects the page to getExecutiveDashboard()
   (teamCapacity for each person's workload, forecast for unallocated work).
   Allocating checks happens in the Cases register (dispatch flow).
   ===================================================================== */

const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

function LiveVerifierOperations() {
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const q = useQuery({ queryKey: ["dashboards", "executive", {}], queryFn: () => getExecutiveDashboard() });
  if (q.isError && !q.data) return <PageError message={messageOf(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data) return <PageLoading label="Loading verifier workload…" />;
  return (
    <VerifierOperations
      verifiers={toVerifiers(q.data)}
      unallocated={toUnallocated(q.data)}
      onAllocate={() => navigate("/admin/cases")}
      onAutoBalance={() => toast("Auto-balancing isn't available yet. Allocate checks from the Cases register.", "info")}
    />
  );
}

export default function VerifierOperationsRoute() {
  return USE_SAMPLE_DATA ? <VerifierOperations /> : <LiveVerifierOperations />;
}
