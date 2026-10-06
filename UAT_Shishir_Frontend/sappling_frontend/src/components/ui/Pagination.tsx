import "./pagination.css";

/* =====================================================================
   Pagination: the one pager used by every list page.

   Two styles, matching the two kinds of API list:

   1. Page numbers (most lists)
        <Pagination page={2} pageCount={5} total={92} pageSize={20}
                    onPageChange={setPage} itemLabel="cases" />

   2. "Load more" (lists the API sends in chunks, with a cursor)
        <Pagination mode="more" shown={rows.length} hasMore={!!nextCursor}
                    onLoadMore={loadMore} loading={isFetching} itemLabel="reports" />
   ===================================================================== */

interface PageModeProps {
  mode?: "pages";
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** total number of rows across all pages (shows "Showing 21–40 of 92") */
  total?: number;
  pageSize?: number;
  itemLabel?: string;
  /** true while the next page is loading from the server */
  loading?: boolean;
}

interface MoreModeProps {
  mode: "more";
  /** how many rows are on screen */
  shown: number;
  hasMore: boolean;
  onLoadMore: () => void;
  loading?: boolean;
  itemLabel?: string;
}

export type PaginationProps = PageModeProps | MoreModeProps;

/** Page numbers to show: 1 … 4 5 6 … 12 */
export function pageNumbers(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const Arrow = ({ back }: { back?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={back ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
  </svg>
);

export function Pagination(props: PaginationProps) {
  const label = props.itemLabel ?? "items";

  if (props.mode === "more") {
    return (
      <footer className="pagination-bar">
        <span className="pagination-summary">
          Showing <strong>{props.shown.toLocaleString("en-IN")}</strong> {label}
          {!props.hasMore && props.shown > 0 && " (all loaded)"}
        </span>
        {props.hasMore && (
          <button className="pagination-more" onClick={props.onLoadMore} disabled={props.loading}>
            {props.loading ? "Loading…" : `Load more ${label}`}
          </button>
        )}
      </footer>
    );
  }

  const { page, pageCount, onPageChange, total, pageSize, loading } = props;
  const go = (p: number) => {
    if (p < 1 || p > pageCount || p === page || loading) return;
    onPageChange(p);
  };
  const first = total && pageSize ? (page - 1) * pageSize + 1 : 0;
  const last = total && pageSize ? Math.min(page * pageSize, total) : 0;

  return (
    <footer className="pagination-bar">
      <span className="pagination-summary">
        {total !== undefined && pageSize ? (
          total === 0 ? (
            <>No {label}</>
          ) : (
            <>Showing <strong>{first}–{last}</strong> of <strong>{total.toLocaleString("en-IN")}</strong> {label}</>
          )
        ) : (
          <>Page <strong>{page}</strong> of <strong>{pageCount}</strong></>
        )}
      </span>

      {pageCount > 1 && (
        <nav className="pagination" aria-label="Pagination">
          <button className="pagination-button" onClick={() => go(page - 1)} disabled={page === 1 || loading} aria-label="Previous page">
            <Arrow back />
          </button>
          {pageNumbers(page, pageCount).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="pagination-gap" aria-hidden="true">…</span>
            ) : (
              <button
                key={p}
                className={`pagination-button pagination-number ${p === page ? "is-current" : ""}`}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                onClick={() => go(p)}
                disabled={loading && p !== page}
              >
                {p}
              </button>
            )
          )}
          <button className="pagination-button" onClick={() => go(page + 1)} disabled={page === pageCount || loading} aria-label="Next page">
            <Arrow />
          </button>
        </nav>
      )}
    </footer>
  );
}
