import { useEffect, useMemo, useState } from "react";

/* =====================================================================
   usePagination: split a list into pages (for lists held in the browser,
   e.g. sample data). For server-paged lists, the route passes the page
   number and total straight to <Pagination> instead.

     const paged = usePagination(filteredRows, 10, [search, status]);
     paged.items      → rows for the current page
     <Pagination {...paged.props} itemLabel="cases" />

   resetOn: when any of these values change (search, filters), go back to page 1.
   ===================================================================== */

export function usePagination<T>(all: T[], pageSize: number, resetOn: unknown[] = []) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(all.length / pageSize));
  const current = Math.min(page, pageCount);

  const resetKey = JSON.stringify(resetOn);
  useEffect(() => setPage(1), [resetKey]);

  const items = useMemo(() => all.slice((current - 1) * pageSize, current * pageSize), [all, current, pageSize]);

  return {
    items,
    page: current,
    setPage,
    pageCount,
    /** spread into <Pagination /> */
    props: { page: current, pageCount, total: all.length, pageSize, onPageChange: setPage },
  };
}
