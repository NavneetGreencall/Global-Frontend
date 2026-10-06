import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Header, Sidebar, SAPLING_LOGO } from "@/layout";
import { SAMPLE_USER } from "@/sample-data/user";
import { EVENTS } from "@/sample-data/audit-trail";
import { Pagination } from "@/components/ui";
import type { ShellProps } from "@/layout";
import "./audit-trail.css";

/* =====================================================================
   Audit trail

   The first four events come from your live page; the rest are SAMPLE
   events showing the other categories. Pass real data with:
     <AuditTrail events={items} totalEvents={1278} />

   Each event:
     category:  "access" | "security" | "configuration" | "case" | "report"
     changes:   list of { field, from, to }  (from/to may be null)
   ===================================================================== */

/* ---------- data types ---------- */

export type AuditCategory = "access" | "security" | "configuration" | "case" | "report" | "other";

/** One field change: old value → new value (either may be null) */
export interface AuditChange {
  field: string;
  from: string | null;
  to: string | null;
}

export interface AuditEventItem {
  id: string;
  category: AuditCategory;
  action: string; // e.g. "auth.login.succeeded"
  resource: string; // e.g. "user/…" or "case/…"
  actor: string;
  actorType: string;
  device: string;
  ip: string;
  requestId: string | null;
  at: string; // ISO date-time
  changes: AuditChange[];
}

const CATEGORIES: Record<AuditCategory, string> = {
  access: "Access",
  security: "Security",
  configuration: "Configuration",
  case: "Case",
  report: "Report",
  other: "Other",
};

const PAGE_SIZE = 20;

/* ---------- helpers ---------- */

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
  }) + " IST";

const istDay = (d: string | number) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

function downloadCsv(rows: AuditEventItem[], filename: string) {
  const head = ["Time", "Category", "Action", "Resource", "Actor", "Actor type", "Device", "IP", "Request ID", "Changes"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((e) =>
    [
      formatTime(e.at), CATEGORIES[e.category] ?? e.category, e.action, e.resource, e.actor, e.actorType, e.device, e.ip, e.requestId ?? "",
      e.changes.map((c) => `${c.field}: ${c.from ?? "—"} → ${c.to ?? "—"}`).join("; "),
    ].map(esc).join(",")
  );
  const blob = new Blob([[head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- icons ---------- */

const ICONS: Record<string, ReactNode> = {
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r=".8" /><circle cx="4.5" cy="12" r=".8" /><circle cx="4.5" cy="18" r=".8" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5M12 16h.01" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  down: <path d="M7 10l5 5 5-5" />,
  download: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M5 15V6a1 1 0 0 1 1-1h9" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
};

const Icon = ({ name, size = 16 }: { name: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- copy-to-clipboard button ---------- */

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      className="copy-button"
      aria-label={copied ? "Copied" : `Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
      onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true))}
    >
      <Icon name={copied ? "check" : "copy"} size={13} />
    </button>
  );
}

/* ---------- one event ---------- */

function AuditEvent({ event }: { event: AuditEventItem }) {
  const failed = event.action.endsWith(".failed");
  return (
    <li className={`audit-event ${failed ? "audit-failed" : ""}`}>
      <div className="audit-event-top">
        <span className={`category-pill category-${event.category}`}>
          <i />{CATEGORIES[event.category] ?? event.category}
        </span>
        <span className="audit-action">{event.action}</span>
        <span className="audit-resource">
          {event.resource}
          <CopyButton text={event.resource} label="resource ID" />
        </span>
        <time className="audit-time" dateTime={event.at}>{formatTime(event.at)}</time>
      </div>

      <p className="audit-meta">
        <strong>{event.actor}</strong>
        <span className="audit-dot">·</span>{event.actorType}
        <span className="audit-dot">·</span>{event.device}
        <span className="audit-dot">·</span>IP {event.ip}
        <span className="audit-dot">·</span>request {event.requestId ?? "—"}
      </p>

      {event.changes.length > 0 && (
        <ul className="audit-changes">
          {event.changes.map((c) => (
            <li key={c.field} className="audit-change">
              <span className="audit-change-field">{c.field}</span>
              {c.from == null ? <span className="audit-change-arrow">—</span> : <span className="audit-change-from">{c.from}</span>}
              <span className="audit-change-arrow" aria-label="changed to">→</span>
              <span className="audit-change-to">{c.to ?? "—"}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/* ---------- page ---------- */

/** Filters kept in the URL and sent to the API in live mode */
export interface AuditFilters {
  page: number;
  search: string;
  actor: string; // "all" = no filter
  resourceType: string; // "all" = no filter
}

/**
 * Live mode: the server does the searching, filtering and paging.
 * Without it, the page filters and pages the events it was given (sample mode).
 */
export interface AuditServerMode {
  filters: AuditFilters;
  pageSize: number;
  total: number;
  actors: string[];
  resourceTypes: string[];
  /** true while a newer page is loading; the current rows stay visible */
  loading: boolean;
  /** message when the latest load failed but older rows are still shown */
  error?: string | null;
  onRetry?: () => void;
  onChange: (next: Partial<AuditFilters>) => void;
}

interface AuditTrailProps extends ShellProps {
  events?: AuditEventItem[];
  totalEvents?: number;
  server?: AuditServerMode;
}

export default function AuditTrail({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  events = EVENTS,
  totalEvents = 1278,
  user = SAMPLE_USER,
  onSearch = (q: string) => console.log("search", q),
  server,
}: AuditTrailProps) {
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [actor, setActor] = useState("all");
  const [page, setPage] = useState(1);

  const actors = useMemo(() => [...new Set(events.map((e) => e.actor))].sort(), [events]);
  const today = istDay(Date.now());

  const summary = [
    { icon: "list", label: "Audited events", value: totalEvents.toLocaleString("en-IN"), note: "Matching events in the log" },
    { icon: "users", label: "Active today", value: new Set(events.filter((e) => istDay(e.at) === today).map((e) => e.actor)).size, note: "Different people with events today" },
    { icon: "sliders", label: "Configuration changes", value: events.filter((e) => e.category === "configuration").length, note: server ? "On this page" : "In the loaded events" },
    { icon: "alert", label: "Failed sign-ins", value: events.filter((e) => e.action === "auth.login.failed").length, note: server ? "On this page" : "In the loaded events", alert: true },
  ];

  const list = useMemo(() => {
    if (server) return events; // the server already searched, filtered and sorted
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => category === "all" || e.category === category)
      .filter((e) => actor === "all" || e.actor === actor)
      .filter((e) => !q || [e.action, e.resource, e.requestId ?? "", e.actor].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [events, query, category, actor, server]);

  // Paging: from the server in live mode, otherwise over the local list
  const pageSize = server?.pageSize ?? PAGE_SIZE;
  const totalRows = server ? server.total : list.length;
  const pages = Math.max(1, Math.ceil(totalRows / pageSize));
  const current = server ? Math.min(server.filters.page, pages) : Math.min(page, pages);
  const rows = server ? list : list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const firstRow = totalRows === 0 ? 0 : (current - 1) * pageSize + 1;
  const lastRow = Math.min(current * pageSize, totalRows);
  const goToPage = (n: number) => (server ? server.onChange({ page: n }) : setPage(n));

  // The three filter controls read and write either the server filters or local state
  const searchValue = server ? server.filters.search : query;
  const setSearchValue = (v: string) => (server ? server.onChange({ search: v, page: 1 }) : (setQuery(v), setPage(1)));
  const actorValue = server ? server.filters.actor : actor;
  const setActorValue = (v: string) => (server ? server.onChange({ actor: v, page: 1 }) : (setActor(v), setPage(1)));
  const actorOptions = server ? server.actors : actors;
  const filtered = server
    ? Boolean(server.filters.search || server.filters.actor !== "all" || server.filters.resourceType !== "all")
    : Boolean(query || category !== "all" || actor !== "all");

  const clearFilters = () =>
    server
      ? server.onChange({ search: "", actor: "all", resourceType: "all", page: 1 })
      : (setQuery(""), setCategory("all"), setActor("all"), setPage(1));

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page audit-page">
          {/* Page header */}
          <header className="page-header audit-header">
            <div>
              <p className="page-eyebrow">Platform</p>
              <h1 className="page-title">Audit trail</h1>
              <p className="page-subtitle">{totalEvents.toLocaleString("en-IN")} matching audited events. Every sign-in and change is recorded here.</p>
            </div>
            <button className="audit-export-button" onClick={() => downloadCsv(rows, `audit-trail-page-${current}.csv`)}>
              <Icon name="download" size={15} /> Export current page
            </button>
          </header>

          {/* Summary cards */}
          <div className="summary-cards">
            {summary.map((s) => (
              <div key={s.label} className={`summary-card ${s.alert && s.value ? "summary-card-alert" : ""}`}>
                <div className="summary-card-top">
                  <span className="summary-card-label">{s.label}</span>
                  <span className="summary-card-icon"><Icon name={s.icon} /></span>
                </div>
                <strong className="summary-card-value">{s.value}</strong>
                <span className="summary-card-note">{s.note}</span>
              </div>
            ))}
          </div>

          {/* Event log */}
          <section className="audit-card" aria-label="Audit events">
            <div className="audit-toolbar">
              <label className="search-box">
                <span className="visually-hidden">Search events</span>
                <Icon name="search" />
                <input type="search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search action, resource or request ID" />
              </label>

              {server ? (
                <label className="filter-select">
                  <span className="visually-hidden">Resource type</span>
                  <select value={server.filters.resourceType} onChange={(e) => server.onChange({ resourceType: e.target.value, page: 1 })}>
                    <option value="all">All resource types</option>
                    {server.resourceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <Icon name="down" />
                </label>
              ) : (
                <label className="filter-select">
                  <span className="visually-hidden">Category</span>
                  <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
                    <option value="all">All categories</option>
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <Icon name="down" />
                </label>
              )}

              <label className="filter-select">
                <span className="visually-hidden">Actor</span>
                <select value={actorValue} onChange={(e) => setActorValue(e.target.value)}>
                  <option value="all">All actors</option>
                  {actorOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <Icon name="down" />
              </label>

              <span className="audit-count">
                {server ? (
                  <>Showing <strong>{firstRow}–{lastRow}</strong> of <strong>{totalRows.toLocaleString("en-IN")}</strong></>
                ) : (
                  <>Showing <strong>{list.length}</strong> of <strong>{events.length}</strong> loaded</>
                )}
              </span>
            </div>

            {server?.error && (
              <div className="audit-load-error" role="alert">
                <span>Couldn't load the latest events: {server.error}</span>
                {server.onRetry && <button className="action-button" onClick={server.onRetry}>Try again</button>}
              </div>
            )}

            {rows.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon"><Icon name="search" size={22} /></span>
                <strong>No event matches</strong>
                <p>{filtered ? "Try another action, resource or actor." : "No events have been recorded yet."}</p>
                {filtered && <button className="action-button" onClick={clearFilters}>Clear filters</button>}
              </div>
            ) : (
              <ul className={`audit-list ${server?.loading ? "audit-list-loading" : ""}`} aria-busy={server?.loading || undefined}>
                {rows.map((e) => <AuditEvent key={e.id} event={e} />)}
              </ul>
            )}

            <Pagination page={current} pageCount={pages} total={totalRows} pageSize={pageSize} onPageChange={goToPage} loading={server?.loading} itemLabel="events" />
          </section>
        </main>
      </div>
    </div>
  );
}
