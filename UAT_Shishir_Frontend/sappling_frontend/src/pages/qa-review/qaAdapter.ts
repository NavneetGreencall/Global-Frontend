import type { QaRegisterItem } from "@/lib/backend-api/qa-register";
import type { QaItem, QaRisk } from "./QaReviewPage";

/* =====================================================================
   Converts getQaRegister() items into QA queue rows.
   The register has no discrepancy count, so that column shows "—".
   ===================================================================== */

export function riskOf(highestRisk: string | null): QaRisk {
  const r = (highestRisk ?? "").toUpperCase();
  if (r === "HIGH" || r === "CRITICAL") return "high";
  if (r === "MEDIUM") return "medium";
  return "low";
}

export function toQaItem(x: QaRegisterItem): QaItem {
  return {
    id: x.caseNumber,
    candidate: x.subject.fullName,
    client: x.client.displayName,
    risk: riskOf(x.highestRisk),
    reviewer: x.qaReviewer?.displayName ?? null,
    hoursAtGate: Math.max(0, Math.round((Date.now() - new Date(x.qaClaimedAt ?? x.createdAt).getTime()) / 3_600_000)),
    dueMinutes: x.dueAt ? Math.round((new Date(x.dueAt).getTime() - Date.now()) / 60_000) : null,
    discrepancies: null,
  };
}
