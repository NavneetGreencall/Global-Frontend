import { useQuery } from "@tanstack/react-query";
import QAReview from "./QaReviewPage";
import { toQaItem } from "./qaAdapter";
import { PageError, PageLoading } from "@/components/ui";
import { getQaRegister } from "@/lib/backend-api/qa-register";
import type { QaRegisterItem } from "@/lib/backend-api/qa-register";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   QA Review: connects the page to getQaRegister().
   Reads the register page by page (up to MAX_ITEMS); the page's tabs
   (unclaimed, claimed, high risk, overdue) filter what was read.
   ===================================================================== */

const MAX_ITEMS = 500;
const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

async function loadRegister() {
  const all: QaRegisterItem[] = [];
  for (let page = 1; all.length < MAX_ITEMS; page += 1) {
    const res = await getQaRegister({ page, limit: 100, view: "all" });
    all.push(...res.items);
    if (res.items.length === 0 || all.length >= res.total) break;
  }
  return all;
}

function LiveQAReview() {
  const q = useQuery({ queryKey: ["qa", "register"], queryFn: loadRegister });
  if (q.isError && !q.data) return <PageError message={messageOf(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data) return <PageLoading label="Loading the QA queue…" />;
  return <QAReview queue={q.data.map(toQaItem)} />;
}

export default function QaReviewRoute() {
  return USE_SAMPLE_DATA ? <QAReview /> : <LiveQAReview />;
}
