import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ReleasedReports from "./ReleasedReportsPage";
import { toReleasedReport } from "./reportsAdapter";
import { PageError, PageLoading, useFeedback } from "@/components/ui";
import { downloadReport, listPublishedReports } from "@/lib/backend-api/reports";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Released reports: connects the page to reports.ts.
   - listPublishedReports() sends reports in chunks (cursor) → "Load more"
   - PDF: downloadReport(reportId, caseNumber)
   - View: opens the case in the Cases register
   ===================================================================== */

const CHUNK = 20;
const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

function LiveReleasedReports() {
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const q = useInfiniteQuery({
    queryKey: ["reports", "published"],
    queryFn: ({ pageParam }) => listPublishedReports({ cursor: pageParam, limit: CHUNK }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  if (q.isError && !q.data) return <PageError message={messageOf(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data) return <PageLoading label="Loading released reports…" />;

  const reports = q.data.pages.flatMap((p) => p.items).map(toReleasedReport);

  return (
    <ReleasedReports
      reports={reports}
      onView={(r) => navigate(`/admin/cases?search=${encodeURIComponent(r.caseId)}`)}
      onDownload={(r) => downloadReport(r.id, r.caseId).then(() => toast(`Report for ${r.caseId} downloaded`), (err) => toast(`Couldn't download the report: ${messageOf(err)}`, "error"))}
      more={{ hasMore: Boolean(q.hasNextPage), onLoadMore: () => q.fetchNextPage(), loading: q.isFetchingNextPage }}
    />
  );
}

export default function ReleasedReportsRoute() {
  return USE_SAMPLE_DATA ? <ReleasedReports /> : <LiveReleasedReports />;
}
