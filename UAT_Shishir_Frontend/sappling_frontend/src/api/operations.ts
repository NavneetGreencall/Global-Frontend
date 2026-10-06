import { apiRequest } from "@/lib/backend-api/client";

/* =====================================================================
   Operations Manager endpoints from Navneet's integration guide that are
   not in the copied src/lib/backend-api files yet.
   Base: /api/v1 (added by apiRequest), cookie session.
   ===================================================================== */

/** GET /dashboards/navigation: live badge counts for the sidebar */
export function getNavigationCounts() {
  return apiRequest<unknown>("/dashboards/navigation");
}

/** PATCH /cases/:caseId/owner: assign or reassign the case owner */
export function assignCaseOwner(caseId: string, ownerUserId: string) {
  return apiRequest<unknown>(`/cases/${encodeURIComponent(caseId)}/owner`, {
    method: "PATCH",
    body: JSON.stringify({ ownerUserId }),
  });
}

/* ---------------------------------------------------------------------
   The guide describes the navigation response only by example
   ("Open cases: 12, Approvals: 4, Exceptions: 2"), so this reads it
   carefully: an object of counts, or a list of { key/label, count }.
   Counts are matched to sidebar items by name. A sidebar item with no
   matching count shows no badge (never a sample number).
   ⚠ Once the real response is known, tighten the names below.
   --------------------------------------------------------------------- */

const MATCH: Record<string, string[]> = {
  cases: ["opencases", "cases", "casesopen", "open", "activecases"],
  qa: ["qa", "qareview", "inqa", "qaqueue", "qapending"],
  exceptions: ["exceptions", "openexceptions", "flagged"],
};

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export function toNavCounts(data: unknown): Record<string, number> {
  const pairs: [string, number][] = [];
  const add = (key: unknown, value: unknown) => {
    if (typeof key === "string" && typeof value === "number" && Number.isFinite(value)) pairs.push([normalise(key), value]);
  };
  const root = (data as { items?: unknown; counts?: unknown } | null) ?? {};
  const source = (root as { counts?: unknown }).counts ?? (root as { items?: unknown }).items ?? data;
  if (Array.isArray(source)) {
    for (const row of source as Record<string, unknown>[]) add(row.key ?? row.id ?? row.label ?? row.name, row.count ?? row.value);
  } else if (source && typeof source === "object") {
    for (const [k, v] of Object.entries(source as Record<string, unknown>)) add(k, v);
  }
  const out: Record<string, number> = {};
  for (const [navId, names] of Object.entries(MATCH)) {
    const hit = pairs.find(([k]) => names.includes(k));
    if (hit) out[navId] = hit[1];
  }
  return out;
}
