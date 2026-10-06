import "./page-state.css";

/* =====================================================================
   PageSkeleton: shown while a page's data loads.
   Grey placeholder blocks in the shape of a typical page (title, cards,
   a wide panel) plus a small "Loading data…" pill, so the layout is
   visible straight away and the real content replaces it in place.
   ===================================================================== */

export function PageSkeleton({ label = "Loading data…", cards = 6 }: { label?: string; cards?: number }) {
  return (
    <main className="page skeleton-page" aria-busy="true">
      <div className="skeleton-pill" role="status" aria-live="polite">
        <span className="skeleton-spinner" aria-hidden="true" />
        {label}
      </div>

      <div className="skeleton-heading" aria-hidden="true">
        <span className="sk sk-line sk-w-15" />
        <span className="sk sk-title" />
        <span className="sk sk-line sk-w-40" />
      </div>

      <div className="skeleton-grid" aria-hidden="true">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="skeleton-card">
            <span className="sk sk-line sk-w-35" />
            <span className="sk sk-value" />
            <span className="sk sk-line sk-w-90" />
            <span className="sk sk-bar" />
          </div>
        ))}
      </div>

      <div className="sk skeleton-wide" aria-hidden="true" />
    </main>
  );
}
