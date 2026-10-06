import "./page-state.css";
import { PageSkeleton } from "./PageSkeleton";

/* =====================================================================
   What a page shows while its data loads, or when loading fails.
   ===================================================================== */

/** While data loads: the page's shape in placeholder blocks (see PageSkeleton) */
export function PageLoading({ label = "Loading data…" }: { label?: string }) {
  return <PageSkeleton label={label} />;
}

interface PageErrorProps {
  message: string;
  onRetry?: () => void;
}

export function PageError({ message, onRetry }: PageErrorProps) {
  return (
    <main className="page page-state" role="alert">
      <span className="page-state-icon" aria-hidden="true">!</span>
      <strong className="page-state-title">This page couldn't load</strong>
      <p className="page-state-text">{message}</p>
      {onRetry && (
        <button className="page-state-retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </main>
  );
}
