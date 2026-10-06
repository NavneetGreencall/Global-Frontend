import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ControlTower from "./ControlTowerPage";
import AssignOwnerDialog, { assignCases, findUserByEmail } from "@/pages/cases/AssignOwnerDialog";
import type { CaseRef } from "@/pages/cases/AssignOwnerDialog";
import { useSession } from "@/auth/session";
import { toIntake, toPerformance, toQueue, toResults, toRevenue, toSignals, toStages } from "./controlTowerAdapter";
import { PageError, PageLoading, useFeedback } from "@/components/ui";
import { getExceptionsDashboard, getExecutiveDashboard, getOperationsDashboard } from "@/lib/backend-api/dashboards";
import { listCases } from "@/lib/backend-api/cases";
import { getFinanceOverview } from "@/lib/backend-api/finance";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Control Tower: connects the page to several APIs at once.
   - Pipeline, totals, results, intake:  getOperationsDashboard()
   - SLA % and average completion:       getExecutiveDashboard().performance
   - Action queue (cases without owner): listCases({ unassigned: true })
   - Revenue:                            getFinanceOverview()
   - Client actions, critical exceptions: getExceptionsDashboard()
   Only the operations dashboard is required; if another source fails,
   its part of the page shows "—" or 0 instead of failing the whole page.
   ===================================================================== */

const NO_FINANCE = {
  summary: { invoiceCount: 0, openInvoiceCount: 0, billed: 0, collected: 0, credited: 0, outstanding: 0, overdueAmount: 0, overdueCount: 0 },
  ageing: [],
  generatedAt: "",
};

const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

/** "me" assigns straight to the signed-in person; "choose" opens the dialog */
function useAssign(email: string | undefined, idOf: (caseNumber: string) => string | undefined, reload: () => void) {
  const [assigning, setAssigning] = useState<CaseRef[] | null>(null);
  const { toast } = useFeedback();
  const assign = async (caseNumber: string, mode: "me" | "choose") => {
    const ref = { id: idOf(caseNumber) ?? caseNumber, caseNumber };
    if (mode === "choose") return setAssigning([ref]);
    const me = email ? await findUserByEmail(email).catch(() => null) : null;
    if (!me) return toast("Couldn't find your user record, so choose the owner instead.", "error");
    const failed = await assignCases([ref], me.id);
    if (failed.length) toast(`Couldn't assign ${caseNumber}: ${failed[0].reason}`, "error");
    else toast(`${caseNumber} is now yours`);
    reload();
  };
  const dialog = assigning && <AssignOwnerDialog cases={assigning} onClose={() => setAssigning(null)} onAssigned={() => { toast("Owner assigned"); reload(); }} />;
  const notYet = (what: string) => toast(`${what} isn't available in this dashboard yet. Use the existing case screen for now.`, "info");
  return { assign, dialog, notYet };
}

function LiveControlTower() {
  const queryClient = useQueryClient();
  const session = useSession();
  const ops = useQuery({ queryKey: ["dashboards", "operations"], queryFn: getOperationsDashboard });
  const exec = useQuery({ queryKey: ["dashboards", "executive", {}], queryFn: () => getExecutiveDashboard() });
  const queue = useQuery({ queryKey: ["cases", "unassigned"], queryFn: () => listCases({ unassigned: true, limit: 50 }) });
  const finance = useQuery({ queryKey: ["finance", "overview"], queryFn: getFinanceOverview });
  const exceptions = useQuery({ queryKey: ["dashboards", "exceptions"], queryFn: getExceptionsDashboard });
  const idByNumber = new Map((queue.data?.items ?? []).map((c) => [c.caseNumber, c.id]));
  const { assign, dialog, notYet } = useAssign(session.data?.email, (n) => idByNumber.get(n), () => {
    queryClient.invalidateQueries({ queryKey: ["cases"] });
    queryClient.invalidateQueries({ queryKey: ["dashboards"] });
  });

  if (ops.isError && !ops.data) return <PageError message={messageOf(ops.error)} onRetry={() => ops.refetch()} />;
  if (!ops.data) return <PageLoading label="Loading the Control Tower…" />;

  const perf = toPerformance(exec.data);

  return (
    <>
    <ControlTower
      stages={toStages(ops.data)}
      queue={queue.data ? toQueue(queue.data.items) : []}
      signals={toSignals(ops.data, exceptions.data?.summary.clientActions ?? null, exceptions.data?.summary.critical ?? null)}
      revenue={toRevenue(finance.data ?? NO_FINANCE)} // zeros (not sample figures) until finance loads
      results={toResults(ops.data.outcomeMix)}
      intake={toIntake(ops.data)}
      sla={perf.sla}
      avgCompletion={perf.avgCompletion}
      onAssign={assign}
      onRegister={() => notYet("Registering a case")}
    />
    {dialog}
    </>
  );
}

/** Sample mode: the page's own sample data; Assign still works (nothing is saved) */
function SampleControlTower() {
  const { assign, dialog, notYet } = useAssign("nikhil@saplingglobal.in", (n) => n, () => {});
  return (
    <>
      <ControlTower onAssign={assign} onRegister={() => notYet("Registering a case")} />
      {dialog}
    </>
  );
}

export default function ControlTowerRoute() {
  return USE_SAMPLE_DATA ? <SampleControlTower /> : <LiveControlTower />;
}
