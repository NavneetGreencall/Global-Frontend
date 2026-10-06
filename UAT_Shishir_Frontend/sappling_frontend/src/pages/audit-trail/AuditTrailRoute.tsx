import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import AuditTrail from "./AuditTrailPage";
import type { AuditFilters } from "./AuditTrailPage";
import { PageError, PageLoading } from "@/components/ui/PageState";
import { getAuditFacets, listAuditEvents } from "@/lib/backend-api/audit";
import { toAuditEvent } from "./auditAdapter";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Audit Trail: connects the page to the API.

   - Page number, search and filters live in the URL
     (/admin/audit?page=2&q=login&actor=…&type=…), so refresh and shared
     links keep the same view.
   - Search waits 300 ms after typing before asking the server.
   - While the next page loads, the current rows stay on screen (faded).
   ===================================================================== */

const PAGE_SIZE = 20;

/**
 * Names of the query parameters the API expects.
 * ⚠ Confirm these against the existing frontend's audit screen
 *   (search features-reference / its routes for "listAuditEvents(").
 */
const PARAMS = {
  page: "page",
  pageSize: "pageSize",
  search: "search",
  actor: "actor",
  resourceType: "resourceType",
} as const;

function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

function LiveAuditTrail() {
  const [params, setParams] = useSearchParams();
  const filters: AuditFilters = {
    page: Math.max(1, Number(params.get("page")) || 1),
    search: params.get("q") ?? "",
    actor: params.get("actor") ?? "all",
    resourceType: params.get("type") ?? "all",
  };
  const search = useDebounced(filters.search.trim());

  const events = useQuery({
    queryKey: ["audit-events", filters.page, search, filters.actor, filters.resourceType],
    queryFn: () =>
      listAuditEvents({
        [PARAMS.page]: filters.page,
        [PARAMS.pageSize]: PAGE_SIZE,
        [PARAMS.search]: search || undefined,
        [PARAMS.actor]: filters.actor, // "all" is skipped by listAuditEvents
        [PARAMS.resourceType]: filters.resourceType,
      }),
    placeholderData: keepPreviousData,
  });

  const facets = useQuery({ queryKey: ["audit-facets"], queryFn: getAuditFacets, staleTime: 5 * 60_000 });

  // Remember the last page that loaded, so a failed reload keeps those rows on screen
  const lastGood = useRef(events.data);
  if (events.data) lastGood.current = events.data;
  const shown = events.data ?? lastGood.current;

  const onChange = (next: Partial<AuditFilters>) => {
    const f = { ...filters, ...next };
    const p = new URLSearchParams();
    if (f.page > 1) p.set("page", String(f.page));
    if (f.search) p.set("q", f.search);
    if (f.actor !== "all") p.set("actor", f.actor);
    if (f.resourceType !== "all") p.set("type", f.resourceType);
    setParams(p, { replace: true });
  };

  // Nothing has loaded yet: full-page error with Retry, or the loading screen
  if (!shown) {
    if (events.isError) return <PageError message={messageOf(events.error)} onRetry={() => events.refetch()} />;
    return <PageLoading label="Loading audit events…" />;
  }

  // If a reload failed, the rows shown are from the last page that worked
  const showingOld = !events.data;

  return (
    <AuditTrail
      events={shown.items.map(toAuditEvent)}
      totalEvents={shown.total}
      server={{
        filters: showingOld ? { ...filters, page: shown.page } : filters,
        pageSize: shown.pageSize || PAGE_SIZE,
        total: shown.total,
        actors: facets.data?.actors ?? [],
        resourceTypes: facets.data?.resourceTypes ?? [],
        loading: events.isFetching,
        error: events.isError ? messageOf(events.error) : null,
        onRetry: () => events.refetch(),
        onChange,
      }}
    />
  );
}

export default function AuditTrailRoute() {
  return USE_SAMPLE_DATA ? <AuditTrail /> : <LiveAuditTrail />;
}
