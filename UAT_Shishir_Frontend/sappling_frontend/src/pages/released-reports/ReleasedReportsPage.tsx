import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Header, Sidebar, SAPLING_LOGO } from "@/layout";
import { SAMPLE_USER } from "@/sample-data/user";
import { Pagination } from "@/components/ui";
import type { ShellProps } from "@/layout";

/* =====================================================================
   Released reports

   Your report library is currently empty, so the default is [].
   Each report looks like SAMPLE_REPORTS below. Pass real data with:
     <ReleasedReports reports={items} />

   verdict: "clear" | "discrepancy" | "unable"
   ===================================================================== */

/* ---------- data types ---------- */

export type Verdict = "clear" | "discrepancy" | "unable";

export interface ReleasedReport {
  id: string;
  caseId: string;
  candidate: string;
  client: string;
  pkg: string;
  checks: number | null; // null = not provided by the API (shows "—")
  verdict: Verdict | null; // null = not provided by the API (shows "—")
  releasedAt: string; // ISO date-time
  fileUrl: string;
}

const VERDICTS: Record<Verdict, string> = {
  clear: "Clear",
  discrepancy: "Discrepancy",
  unable: "Unable to verify",
};

const PAGE_SIZE = 10;

/* ---------- helpers ---------- */

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
  });

const isThisMonth = (iso: string) => {
  const d = new Date(iso), now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

/* ---------- icons ---------- */

const ICONS: Record<string, ReactNode> = {
  file: <><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" /><path d="M14 3.5V8h4.5" /><path d="M9.5 14.5l2 2 3.5-4" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  building: <><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M10 20.5v-4h4v4" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  down: <path d="M7 10l5 5 5-5" />,
  download: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  shield: <><path d="M12 3.5l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z" /><path d="M9 12l2 2 4-4" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  rupee: <path d="M7 5h10M7 9h10M7 5c5 0 7 1.5 7 4s-2 4-7 4l7 6" />,
  send: <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />,
};

const Icon = ({ name, size = 16 }: { name: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- empty state: how a report gets released ---------- */

function EmptyLibrary({ searching, onClear }: { searching: boolean; onClear: () => void }) {
  if (searching) {
    return (
      <div className="empty-state">
        <span className="empty-icon"><Icon name="search" size={22} /></span>
        <strong>No report matches this search</strong>
        <p>Check the candidate name or case number and try again.</p>
        <button className="action-button" onClick={onClear}>Clear search</button>
      </div>
    );
  }

  const steps = [
    { icon: "shield", label: "Quality review" },
    { icon: "check", label: "Manager approval" },
    { icon: "rupee", label: "Payment release" },
    { icon: "send", label: "Published here" },
  ];

  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name="file" size={22} /></span>
      <strong>No published report yet</strong>
      <p>A report appears here once it has passed every release step.</p>
      <ol className="release-steps">
        {steps.map((s, i) => (
          <li key={s.label} className="release-step">
            <span className="release-step-icon"><Icon name={s.icon} size={15} /></span>
            <span className="release-step-label">{s.label}</span>
            {i < steps.length - 1 && <span className="release-step-line" aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- page ---------- */

interface ReleasedReportsProps extends ShellProps {
  reports?: ReleasedReport[];
  onView?: (report: ReleasedReport) => void;
  /** live mode: download the PDF through the API instead of following fileUrl */
  onDownload?: (report: ReleasedReport) => void | Promise<void>;
  /** live mode: the API sends reports in chunks; show "Load more" instead of page numbers */
  more?: { hasMore: boolean; onLoadMore: () => void; loading: boolean };
}

export default function ReleasedReports({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  reports = [],
  user = SAMPLE_USER,
  onView = (report: ReleasedReport) => console.log("view", report.caseId),
  onDownload,
  more,
  onSearch = (q: string) => console.log("search", q),
}: ReleasedReportsProps) {
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [client, setClient] = useState("all");
  const [verdict, setVerdict] = useState("all");
  const [page, setPage] = useState(1);

  const clients = useMemo(() => [...new Set(reports.map((r) => r.client))].sort(), [reports]);

  const summary = [
    { icon: "file", label: "Published reports", value: reports.length, note: "Within your authorised scope" },
    { icon: "calendar", label: "Released this month", value: reports.filter((r) => isThisMonth(r.releasedAt)).length, note: "Since the 1st of the month" },
    { icon: "building", label: "Clients covered", value: clients.length, note: "With at least one report" },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports
      .filter((r) => client === "all" || r.client === client)
      .filter((r) => verdict === "all" || r.verdict === verdict)
      .filter((r) => !q || [r.candidate, r.caseId, r.client].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime());
  }, [reports, query, client, verdict]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = more ? filtered : filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const searching = Boolean(query.trim()) || client !== "all" || verdict !== "all";

  const clearFilters = () => { setQuery(""); setClient("all"); setVerdict("all"); setPage(1); };

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page reports-page">
          {/* Page header */}
          <header className="page-header">
            <p className="page-eyebrow">Delivery, Head Office</p>
            <h1 className="page-title">Released reports</h1>
            <p className="page-subtitle">Final reports that have cleared quality review, approval and payment.</p>
          </header>

          {/* Summary cards */}
          <div className="summary-cards">
            {summary.map((s) => (
              <div key={s.label} className="summary-card">
                <div className="summary-card-top">
                  <span className="summary-card-label">{s.label}</span>
                  <span className="summary-card-icon"><Icon name={s.icon} /></span>
                </div>
                <strong className="summary-card-value">{s.value}</strong>
                <span className="summary-card-note">{s.note}</span>
              </div>
            ))}
          </div>

          {/* Library */}
          <section className="report-library" aria-labelledby="library-title">
            <header className="library-header">
              <div>
                <h2 id="library-title" className="library-title">
                  Published report library <span className="count-badge">{filtered.length}</span>
                </h2>
                <p className="library-subtitle">Released reports available only within your authorised scope.</p>
              </div>

              <div className="library-tools">
                <label className="search-box">
                  <span className="visually-hidden">Search reports</span>
                  <Icon name="search" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder="Search candidate or case number"
                  />
                </label>

                <label className="filter-select">
                  <span className="visually-hidden">Client</span>
                  <select value={client} onChange={(e) => { setClient(e.target.value); setPage(1); }}>
                    <option value="all">All clients</option>
                    {clients.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Icon name="down" />
                </label>

                <label className="filter-select">
                  <span className="visually-hidden">Verdict</span>
                  <select value={verdict} onChange={(e) => { setVerdict(e.target.value); setPage(1); }}>
                    <option value="all">Any verdict</option>
                    {Object.entries(VERDICTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <Icon name="down" />
                </label>
              </div>
            </header>

            {rows.length === 0 ? (
              <EmptyLibrary searching={searching} onClear={clearFilters} />
            ) : (
              <ul className="report-list">
                {rows.map((r) => (
                  <li key={r.id} className="report-row">
                    <div className="report-person">
                      <span className="report-avatar">{r.candidate[0].toUpperCase()}</span>
                      <div>
                        <Link to={`/admin/cases/${r.caseId}`} className="report-name">{r.candidate}</Link>
                        <span className="report-case">{r.caseId}</span>
                      </div>
                    </div>

                    <div className="report-cell">
                      <span className="report-label">Client</span>
                      <span className="report-value">{r.client}</span>
                    </div>

                    <div className="report-cell">
                      <span className="report-label">Package</span>
                      <span className="report-value">{r.pkg}</span>
                      {r.checks != null && <span className="report-hint">{r.checks} checks</span>}
                    </div>

                    <div className="report-cell">
                      <span className="report-label">Verdict</span>
                      {r.verdict ? <span className={`verdict-pill verdict-${r.verdict}`}>{VERDICTS[r.verdict] ?? r.verdict}</span> : <span className="report-value">—</span>}
                    </div>

                    <div className="report-cell">
                      <span className="report-label">Released</span>
                      <span className="report-value">{formatDate(r.releasedAt)}</span>
                    </div>

                    <div className="report-actions">
                      <button className="action-button" onClick={() => onView(r)}>
                        <Icon name="eye" size={14} /> View
                      </button>
                      {onDownload ? (
                        <button className="action-button action-button-primary" onClick={() => onDownload(r)}>
                          <Icon name="download" size={14} /> PDF
                        </button>
                      ) : (
                        <a className="action-button action-button-primary" href={r.fileUrl} download>
                          <Icon name="download" size={14} /> PDF
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {more ? (
              <Pagination mode="more" shown={filtered.length} hasMore={more.hasMore} onLoadMore={more.onLoadMore} loading={more.loading} itemLabel="reports" />
            ) : (
              <Pagination page={current} pageCount={pages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} itemLabel="reports" />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
