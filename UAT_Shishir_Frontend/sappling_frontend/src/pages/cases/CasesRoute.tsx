import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CasesRegister from "./CasesPage";
import type { Filters } from "./CasesPage";
import { toCaseRow } from "./casesAdapter";
import AssignOwnerDialog from "./AssignOwnerDialog";
import type { CaseRef } from "./AssignOwnerDialog";
import { PageError, PageLoading, useFeedback } from "@/components/ui";
import { exportCases, listCases } from "@/lib/backend-api/cases";
import type { CaseListItem } from "@/lib/backend-api/cases";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Cases & Delivery: connects the register to cases.ts.
   - Reads cases page by page (up to MAX_CASES, most recently updated
     first); the register filters, sorts and pages them.
   - "Export" downloads the CSV from the API: exportCases().
   - "Assign owner" opens AssignOwnerDialog → PATCH /cases/:caseId/owner.
   ===================================================================== */

const MAX_CASES = 1000;
const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

async function loadCases() {
  const all: CaseListItem[] = [];
  for (let page = 1; all.length < MAX_CASES; page += 1) {
    const res = await listCases({ page, pageSize: 100, limit: 100, sortBy: "updatedAt", sortDir: "desc" });
    all.push(...res.items);
    if (res.items.length === 0 || all.length >= res.total) break;
  }
  return all;
}

function LiveCases() {
  const queryClient = useQueryClient();
  const [assigning, setAssigning] = useState<CaseRef[] | null>(null);
  const { toast } = useFeedback();
  const q = useQuery({ queryKey: ["cases", "register"], queryFn: loadCases });
  if (q.isError && !q.data) return <PageError message={messageOf(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data) return <PageLoading label="Loading cases…" />;

  const exportAll = (f: Filters) =>
    exportCases({ search: f.q || undefined, from: f.from || undefined, to: f.to || undefined }).then(
      () => toast("Cases exported"),
      (err) => toast(`Couldn't export: ${messageOf(err)}`, "error")
    );

  // the register shows case numbers; the API needs each case's id
  const idOf = new Map(q.data.map((c) => [c.caseNumber, c.id]));
  const reload = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["cases"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboards"] }),
    ]);

  return (
    <>
      <CasesRegister
        cases={q.data.map(toCaseRow)}
        onExport={exportAll}
        onAssign={(numbers) => setAssigning(numbers.filter((n) => idOf.has(n)).map((n) => ({ id: idOf.get(n)!, caseNumber: n })))}
      />
      {assigning && assigning.length > 0 && (
        <AssignOwnerDialog cases={assigning} onClose={() => setAssigning(null)} onAssigned={() => { toast("Owner assigned"); reload(); }} />
      )}
    </>
  );
}

/** Sample mode: the register's own sample cases; Assign still opens the dialog */
function SampleCases() {
  const [assigning, setAssigning] = useState<CaseRef[] | null>(null);
  const { toast } = useFeedback();
  return (
    <>
      <CasesRegister onAssign={(numbers) => setAssigning(numbers.map((n) => ({ id: n, caseNumber: n })))} />
      {assigning && <AssignOwnerDialog cases={assigning} onClose={() => setAssigning(null)} onAssigned={() => toast("Owner assigned (sample mode: not saved)")} />}
    </>
  );
}

export default function CasesRoute() {
  return USE_SAMPLE_DATA ? <SampleCases /> : <LiveCases />;
}
