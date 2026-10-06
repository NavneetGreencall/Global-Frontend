import { useQuery, useQueryClient } from "@tanstack/react-query";
import PrivacyDesk from "./PrivacyDeskPage";
import type { PrivacyRecord, Workspace } from "./PrivacyDeskPage";
import { toPrivacyRecord } from "./privacyAdapter";
import { PageError, PageLoading, useFeedback } from "@/components/ui";
import { createPrivacyRecord, listPrivacyRecords } from "@/lib/backend-api/privacy";
import type { PrivacyKind, PrivacyRecord as ApiPrivacyRecord } from "@/lib/backend-api/privacy";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Privacy desk: connects the page to privacy.ts.
   - Reads data requests and incidents with listPrivacyRecords (page by
     page, up to MAX_RECORDS each); the page searches and pages them.
   - "Record request / incident" saves with createPrivacyRecord.
   ===================================================================== */

const MAX_RECORDS = 500;
const KEY = ["privacy-records"] as const;
const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

async function loadAll(kind: PrivacyKind): Promise<ApiPrivacyRecord[]> {
  const all: ApiPrivacyRecord[] = [];
  for (let page = 1; all.length < MAX_RECORDS; page += 1) {
    const res = await listPrivacyRecords({ kind, page, pageSize: 100 });
    all.push(...res.items);
    if (page >= res.pageCount || res.items.length === 0) break;
  }
  return all;
}

function LivePrivacyDesk() {
  const queryClient = useQueryClient();
  const { toast } = useFeedback();
  const requests = useQuery({ queryKey: [...KEY, "DATA_REQUEST"], queryFn: () => loadAll("DATA_REQUEST") });
  const incidents = useQuery({ queryKey: [...KEY, "INCIDENT"], queryFn: () => loadAll("INCIDENT") });

  const failed = requests.isError ? requests : incidents.isError ? incidents : null;
  if (failed && !(requests.data && incidents.data)) return <PageError message={messageOf(failed.error)} onRetry={() => { requests.refetch(); incidents.refetch(); }} />;
  if (!requests.data || !incidents.data) return <PageLoading label="Loading privacy records…" />;

  const record = async (workspace: Workspace, r: PrivacyRecord) => {
    try {
      await createPrivacyRecord({
        kind: workspace === "requests" ? "DATA_REQUEST" : "INCIDENT",
        title: r.title,
        description: r.description || r.title,
        subjectReference: r.subjectRef && r.subjectRef !== "—" ? r.subjectRef : undefined,
        dueAt: r.dueAt ?? undefined,
        ...(workspace === "requests" ? { requestType: r.type.toUpperCase() } : { severity: r.type.toUpperCase() }),
      });
      toast(workspace === "requests" ? "Data request recorded" : "Incident recorded");
    } finally {
      await queryClient.invalidateQueries({ queryKey: KEY }); // show the server's list (also after a failure)
    }
  };

  return (
    <PrivacyDesk
      requests={requests.data.map(toPrivacyRecord)}
      incidents={incidents.data.map(toPrivacyRecord)}
      onRecord={record}
    />
  );
}

export default function PrivacyDeskRoute() {
  return USE_SAMPLE_DATA ? <PrivacyDesk /> : <LivePrivacyDesk />;
}
