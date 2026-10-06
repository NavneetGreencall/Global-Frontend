import { useState } from "react";

/* =====================================================================
   useListState: search, filters and page number for a list page.

   - Sample data: the page keeps them itself (and filters in the browser).
   - Live data:   the page's route passes `server`; the values then come
                  from the URL and every change asks the API for new rows.

     const list = useListState({ search: "", status: "all" }, server);
     list.filters.search, list.set("status", "active"), list.page, list.setPage(2)
   ===================================================================== */

/** What a route passes to a page in live mode */
export interface ServerList<F> {
  filters: F;
  page: number;
  pageSize: number;
  total: number;
  /** true while a newer page is loading (current rows stay on screen) */
  loading: boolean;
  /** set when the latest load failed but older rows are still shown */
  error?: string | null;
  onRetry?: () => void;
  onChange: (next: Partial<F> & { page?: number }) => void;
}

export function useListState<F extends Record<string, string>>(initial: F, server?: ServerList<F>) {
  const [localFilters, setLocalFilters] = useState<F>(initial);
  const [localPage, setLocalPage] = useState(1);

  const filters = server ? server.filters : localFilters;
  const page = server ? server.page : localPage;

  /** change one filter and go back to page 1 */
  const set = <K extends keyof F>(key: K, value: F[K]) => {
    if (server) server.onChange({ [key]: value, page: 1 } as unknown as Partial<F> & { page: number });
    else {
      setLocalFilters((f) => ({ ...f, [key]: value }));
      setLocalPage(1);
    }
  };
  const setPage = (n: number) => (server ? server.onChange({ page: n } as Partial<F> & { page: number }) : setLocalPage(n));
  const reset = () => (server ? server.onChange({ ...initial, page: 1 }) : (setLocalFilters(initial), setLocalPage(1)));
  const isFiltered = (Object.keys(initial) as (keyof F)[]).some((k) => filters[k] !== initial[k]);

  return { filters, set, page, setPage, reset, isFiltered, live: Boolean(server) };
}

/** Keeps the URL in step with the filters (used by routes) */
export function filtersToParams<F extends Record<string, string>>(f: F & { page?: number }, defaults: F): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (k === "page") { if (Number(v) > 1) p.set("page", String(v)); continue; }
    if (v !== undefined && v !== "" && v !== defaults[k]) p.set(k, String(v));
  }
  return p;
}

export function filtersFromParams<F extends Record<string, string>>(params: URLSearchParams, defaults: F): F & { page: number } {
  const out = { ...defaults, page: Math.max(1, Number(params.get("page")) || 1) } as F & { page: number };
  for (const k of Object.keys(defaults)) {
    const v = params.get(k);
    if (v !== null) (out as Record<string, string | number>)[k] = v;
  }
  return out;
}
