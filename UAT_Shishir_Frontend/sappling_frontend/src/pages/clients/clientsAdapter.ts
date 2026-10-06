import type { ClientOption } from "@/lib/backend-api/cases";
import type { ClientAccount, ClientStatus } from "./ClientsPage";

/* =====================================================================
   Converts listClients() items into client cards.
   The API has no per-client case counts or SLA %, so those show "—".
   ===================================================================== */

export function statusOf(apiStatus: string): ClientStatus {
  const s = apiStatus.toUpperCase();
  if (s === "SUSPENDED" || s === "PAUSED" || s === "INACTIVE") return "paused";
  if (s === "ONBOARDING" || s === "PENDING" || s === "DRAFT") return "onboarding";
  return "active";
}

export function toClientAccount(c: ClientOption): ClientAccount {
  return {
    id: c.publicId,
    name: c.displayName,
    code: c.code,
    legalName: c.legalName,
    status: statusOf(c.status),
    activeCases: null,
    portfolio: null,
    slaAttainment: null,
    atRisk: null,
    contact: c.contactName ?? null,
    slaDays: Math.max(1, Math.round(c.slaHours / 24)),
    activeSinceHours: Math.max(0, Math.round((Date.now() - new Date(c.createdAt).getTime()) / 3_600_000)),
  };
}
