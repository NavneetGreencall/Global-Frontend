import type { ExecutiveDashboard } from "@/lib/backend-api/dashboards";
import type { Verifier } from "./VerifierOperationsPage";

/* =====================================================================
   Converts getExecutiveDashboard().teamCapacity into the verifier queue.
   The API gives active / completed / overdue per person; branch and
   "done today" aren't provided, so they show "No branch assigned" and "—".
   ===================================================================== */

export function toVerifiers(d: ExecutiveDashboard): Verifier[] {
  return d.teamCapacity.map((t) => ({
    id: t.id,
    name: t.name,
    branch: null,
    active: t.active,
    overdue: t.overdue,
    doneToday: null,
  }));
}

/** Checks waiting for an owner */
export const toUnallocated = (d: ExecutiveDashboard) => d.forecast.unassignedActive;
