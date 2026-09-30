import { useEffect, useMemo, useState } from "react";
import { Header, Sidebar, SAPLING_LOGO } from "./ControlTower";
import "../Styles/ControlTower.css";
import "../Styles/ReleasedReports.css";
import "../Styles/Audittrail.css";

/* =====================================================================
   Audit trail

   The first four events come from your live page; the rest are SAMPLE
   events showing the other categories. Pass real data with:
     <AuditTrail events={items} totalEvents={1278} />

   Each event:
     category:  "access" | "security" | "configuration" | "case" | "report"
     changes:   list of { field, from, to }  (from/to may be null)
   ===================================================================== */

const EVENTS = [
  {
    id: "e1", category: "access", action: "auth.login.succeeded", resource: "user/e84f8780-5a29-44bb-ab23-fdfa32f439c8",
    actor: "Roopesh kumar", actorType: "Platform user", device: "Local device", ip: "127.0.0.1", requestId: null,
    at: "2026-09-30T15:22:00+05:30",
    changes: [{ field: "userAgent", from: null, to: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36" }],
  },
  {
    id: "e2", category: "access", action: "auth.login.succeeded", resource: "user/fe5620c1-0b22-477b-822a-5a1421015231",
    actor: "Verifier", actorType: "Platform user", device: "Local device", ip: "127.0.0.1", requestId: null,
    at: "2026-09-30T15:02:00+05:30",
    changes: [{ field: "userAgent", from: null, to: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36" }],
  },
  {
    id: "e3", category: "access", action: "auth.login.succeeded", resource: "user/e84f8780-5a29-44bb-ab23-fdfa32f439c8",
    actor: "Roopesh kumar", actorType: "Platform user", device: "Local device", ip: "127.0.0.1", requestId: null,
    at: "2026-09-30T14:43:00+05:30",
    changes: [{ field: "userAgent", from: null, to: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36" }],
  },
  {
    id: "e4", category: "access", action: "auth.login.succeeded", resource: "user/0b80f142-415d-4e0f-88b7-bd52a97b11a8",
    actor: "CEO", actorType: "Platform user", device: "Local device", ip: "127.0.0.1", requestId: null,
    at: "2026-09-30T14:42:00+05:30",
    changes: [{ field: "userAgent", from: null, to: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36" }],
  },
  // SAMPLE events below — replace with real data
  {
    id: "e5", category: "configuration", action: "settings.workspace.updated", resource: "settings/identity",
    actor: "Nikhil", actorType: "Platform admin", device: "Local device", ip: "127.0.0.1", requestId: "req_7f3a91",
    at: "2026-09-30T13:10:00+05:30",
    changes: [{ field: "timezone", from: "UTC", to: "Asia/Kolkata" }],
  },
  {
    id: "e6", category: "security", action: "auth.login.failed", resource: "user/unknown",
    actor: "Unknown", actorType: "Anonymous", device: "Unrecognised device", ip: "10.0.4.18", requestId: "req_2b18c4",
    at: "2026-09-30T12:05:00+05:30",
    changes: [{ field: "reason", from: null, to: "Wrong password (3rd attempt)" }],
  },
  {
    id: "e7", category: "case", action: "case.owner.assigned", resource: "case/SG-20260928-600E89",
    actor: "Nikhil", actorType: "Platform admin", device: "Local device", ip: "127.0.0.1", requestId: "req_91ce02",
    at: "2026-09-30T11:48:00+05:30",
    changes: [{ field: "owner", from: null, to: "Verification Specialist" }],
  },
  {
    id: "e8", category: "report", action: "report.released", resource: "report/SG-20260908-9A1B2C",
    actor: "Manager", actorType: "Platform user", device: "Local device", ip: "127.0.0.1", requestId: "req_44d7aa",
    at: "2026-09-29T16:20:00+05:30",
    changes: [{ field: "status", from: "Approved", to: "Released" }],
  },
];

const CATEGORIES = {
  access: "Access",
  security: "Security",
  configuration: "Configuration",
  case: "Case",
  report: "Report",
};

const PAGE_SIZE = 20;

/* ---------- helpers ---------- */

const formatTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
  }) + " IST";

const istDay = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

function downloadCsv(rows, filename) {
  const head = ["Time", "Category", "Action", "Resource", "Actor", "Actor type", "Device", "IP", "Request ID", "Changes"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
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

const ICONS = {
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

const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- copy-to-clipboard button ---------- */

function CopyButton({ text, label }) {
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

function AuditEvent({ event }) {
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

export default function AuditTrail({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  events = EVENTS,
  totalEvents = 1278,
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onSearch = (q) => console.log("search", q),
}) {
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
    { icon: "sliders", label: "Configuration changes", value: events.filter((e) => e.category === "configuration").length, note: "In the loaded events" },
    { icon: "alert", label: "Failed sign-ins", value: events.filter((e) => e.action === "auth.login.failed").length, note: "In the loaded events", alert: true },
  ];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => category === "all" || e.category === category)
      .filter((e) => actor === "all" || e.actor === actor)
      .filter((e) => !q || [e.action, e.resource, e.requestId ?? "", e.actor].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [events, query, category, actor]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const clearFilters = () => { setQuery(""); setCategory("all"); setActor("all"); setPage(1); };

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
                <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search action, resource or request ID" />
              </label>

              <label className="filter-select">
                <span className="visually-hidden">Category</span>
                <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
                  <option value="all">All categories</option>
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <Icon name="down" />
              </label>

              <label className="filter-select">
                <span className="visually-hidden">Actor</span>
                <select value={actor} onChange={(e) => { setActor(e.target.value); setPage(1); }}>
                  <option value="all">All actors</option>
                  {actors.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <Icon name="down" />
              </label>

              <span className="audit-count">
                Showing <strong>{list.length}</strong> of <strong>{events.length}</strong> loaded
              </span>
            </div>

            {rows.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon"><Icon name="search" size={22} /></span>
                <strong>No event matches</strong>
                <p>Try another action, resource, category or actor.</p>
                <button className="action-button" onClick={clearFilters}>Clear filters</button>
              </div>
            ) : (
              <ul className="audit-list">
                {rows.map((e) => <AuditEvent key={e.id} event={e} />)}
              </ul>
            )}

            <footer className="audit-footer">
              <span>Page <strong>{current}</strong> of <strong>{pages}</strong></span>
              <nav className="pager" aria-label="Pagination">
                <button className="pager-button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
                  <Icon name="left" />
                </button>
                <button className="pager-button" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page">
                  <Icon name="right" />
                </button>
              </nav>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}