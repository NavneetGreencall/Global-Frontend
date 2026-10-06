import type { PrivacyRecord as ApiPrivacyRecord } from "@/lib/backend-api/privacy";
import type { PrivacyRecord } from "./PrivacyDeskPage";

/* =====================================================================
   Converts privacy.ts records into what the Privacy desk shows.
   Statuses arrive as RECEIVED, IN_REVIEW, … and become received, in_review, …
   ===================================================================== */

export function toPrivacyRecord(r: ApiPrivacyRecord): PrivacyRecord {
  return {
    id: r.id,
    title: r.title,
    subjectRef: r.subjectReference ?? "—",
    type: (r.requestType ?? r.severity ?? "other").toLowerCase(),
    status: r.status.toLowerCase(),
    receivedAt: (r as unknown as { createdAt?: string }).createdAt ?? r.dueAt ?? new Date().toISOString(),
    dueAt: r.dueAt,
  };
}
