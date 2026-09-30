import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Sidebar, SAPLING_LOGO } from "./ControlTower";
import "../Styles/ControlTower.css";
import "../Styles/ExecutiveAnalytics.css";
import "../Styles/CaseRegister.css";

/* =====================================================================
   Sample data. The first four rows come from your screens; the rest are
   SAMPLE rows so filters and paging have something to show.
   Replace with your API response (pass `cases` as a prop).

   slaMinutes: minutes left on the SLA (negative = overdue)
   ===================================================================== */

const CASES = [
  { id: "SG-20260928-600E89", candidate: "Vivo", client: "Acme Tech Solutions", pkg: "Standard BGV", checks: 4, stage: "verification", progress: 62, priority: "critical", slaMinutes: -85, owner: null, updated: "2026-09-28" },
  { id: "SG-20260926-691868", candidate: "REALME", client: "Acme Tech Solutions", pkg: "Standard BGV", checks: 4, stage: "verification", progress: 62, priority: "high", slaMinutes: -1560, owner: null, updated: "2026-09-26" },
  { id: "SG-20260830-6B1CF5", candidate: "Harsh Singh", client: "Acme India", pkg: "Standard BGV", checks: 4, stage: "consent", progress: 10, priority: "critical", slaMinutes: -39240, owner: null, updated: "2026-08-30" },
  { id: "SG-20260831-D90636", candidate: "Avneet", client: "Acme India", pkg: "Standard BGV", checks: 4, stage: "consent", progress: 10, priority: "critical", slaMinutes: -40300, owner: null, updated: "2026-08-31" },
  // SAMPLE rows below — replace with real data
  { id: "SG-20260924-A1B2C3", candidate: "Ananya Rao", client: "Acme Tech Solutions", pkg: "HIGHPACKAGE", checks: 6, stage: "documents", progress: 35, priority: "medium", slaMinutes: -300, owner: null, updated: "2026-09-24" },
  { id: "SG-20260922-B4C5D6", candidate: "Rohit Mehra", client: "Nikhil Tech", pkg: "Standard BGV", checks: 4, stage: "qa", progress: 88, priority: "medium", slaMinutes: 2880, owner: null, updated: "2026-09-27" },
  { id: "SG-20260921-C7D8E9", candidate: "Priya Nair", client: "Vision India Pvt Limited.", pkg: "Standard BGV", checks: 4, stage: "qa", progress: 85, priority: "low", slaMinutes: 600, owner: null, updated: "2026-09-27" },
  { id: "SG-20260920-D1E2F3", candidate: "Karan Patel", client: "IRFC", pkg: "Standard BGV", checks: 4, stage: "documents", progress: 30, priority: "high", slaMinutes: 180, owner: null, updated: "2026-09-25" },
  { id: "SG-20260919-E4F5A6", candidate: "Meera Iyer", client: "Navneet Kirana", pkg: "Standard BGV", checks: 4, stage: "verification", progress: 55, priority: "low", slaMinutes: 4320, owner: null, updated: "2026-09-23" },
  { id: "SG-20260918-F7A8B9", candidate: "Arjun Singh", client: "Vision India Pvt Limited.", pkg: "HIGHPACKAGE", checks: 6, stage: "documents", progress: 40, priority: "medium", slaMinutes: -120, owner: null, updated: "2026-09-22" },
];

const STAGES = {
  intake: { label: "Case intake", tone: "slate" },
  consent: { label: "Consent", tone: "amber" },
  documents: { label: "Documents", tone: "orange" },
  verification: { label: "Verification", tone: "blue" },
  clarification: { label: "Clarification", tone: "pink" },
  qa: { label: "QA review", tone: "violet" },
  manager_review: { label: "Manager approval", tone: "indigo" },
  report: { label: "Report preparation", tone: "teal" },
  payment: { label: "Payment & release", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
};

const PRIORITIES = {
  critical: { label: "Critical", rank: 4 },
  high: { label: "High", rank: 3 },
  medium: { label: "Medium", rank: 2 },
  low: { label: "Low", rank: 1 },
};

const COLUMNS = [
  { key: "client", label: "Client" },
  { key: "pkg", label: "Package" },
  { key: "stage", label: "Stage" },
  { key: "progress", label: "Progress" },
  { key: "priority", label: "Priority" },
  { key: "sla", label: "SLA remaining" },
  { key: "owner", label: "Owner" },
  { key: "updated", label: "Updated" },
];

const PAGE_SIZE = 8;
const AT_RISK_MINUTES = 24 * 60; // under 24h left counts as "SLA risk"

/* =====================================================================
   Helpers
   ===================================================================== */

const slaState = (m) => (m < 0 ? "overdue" : m < AT_RISK_MINUTES ? "risk" : "ok");

const duration = (mins) => {
  const m = Math.abs(mins);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${mm}m`;
  return `${mm}m`;
};

const slaText = (m) => (m < 0 ? `Overdue by ${duration(m)}` : `${duration(m)} left`);

const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function downloadCsv(rows, filename) {
  const head = ["Case number", "Candidate", "Client", "Package", "Checks", "Stage", "Progress %", "Priority", "SLA", "Owner", "Updated"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.id, r.candidate, r.client, r.pkg, r.checks, STAGES[r.stage]?.label, r.progress, PRIORITIES[r.priority]?.label, slaText(r.slaMinutes), r.owner ?? "Not assigned", r.updated]
      .map(esc)
      .join(",")
  );
  const blob = new Blob([[head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* =====================================================================
   Icons
   ===================================================================== */

const IP = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  down: <path d="M7 10l5 5 5-5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  columns: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M9.5 4.5v15M14.5 4.5v15" /></>,
  download: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  filter: <path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" />,
  sort: <><path d="M8 9l4-4 4 4" /><path d="M8 15l4 4 4-4" /></>,
  up: <path d="M8 14l4-4 4 4" />,
  user: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  more: <><circle cx="6" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18" cy="12" r="1.3" /></>,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  layers: <><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></>,
  alert: <><path d="M10.3 4.2L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" /><path d="M12 9.5v4M12 17h.01" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
};
const I = ({ n, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {IP[n]}
  </svg>
);

/* =====================================================================
   Small building blocks
   ===================================================================== */

function Select({ label, value, onChange, options }) {
  return (
    <label className="cases-field">
      <span className="cases-field-label">{label}</span>
      <span className="select-field">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <I n="down" />
      </span>
    </label>
  );
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const off = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return { open, setOpen, ref };
}

function ColumnsMenu({ visible, onToggle }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="menu-wrap" ref={ref}>
      <button className="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <I n="columns" /> Columns
      </button>
      {open && (
        <div className="menu menu-columns" role="menu">
          <span className="menu-title">Show columns</span>
          {COLUMNS.map((c) => (
            <label key={c.key} className="menu-checkbox">
              <input type="checkbox" checked={visible[c.key]} onChange={() => onToggle(c.key)} />
              {c.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function RowMenu({ row, onAssign }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="menu-wrap" ref={ref}>
      <button className="icon-button-small" aria-label={`Actions for ${row.candidate}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <I n="more" />
      </button>
      {open && (
        <div className="menu" role="menu">
          <Link role="menuitem" to={`/admin/cases/${row.id}`} onClick={() => setOpen(false)}>Open case</Link>
          <button role="menuitem" onClick={() => { onAssign([row.id]); setOpen(false); }}>Assign owner</button>
          <button role="menuitem" onClick={() => { navigator.clipboard?.writeText(row.id); setOpen(false); }}>Copy case number</button>
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   Page
   ===================================================================== */

const EMPTY_FILTERS = { q: "", stage: "all", client: "all", priority: "all", sla: "all", from: "", to: "" };

export default function CasesRegister({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  cases = CASES,
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onAssign = (ids) => console.log("assign owner", ids),
  onSearch = (q) => console.log("search", q),
}) {
  const [menu, setMenu] = useState(false);
  const [quick, setQuick] = useState("all");
  const [f, setF] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState({ key: "sla", dir: 1 });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [visible, setVisible] = useState(() => Object.fromEntries(COLUMNS.map((c) => [c.key, c.key !== "updated"])));

  // Pre-select from URL, e.g. /admin/cases?stage=consent (links from Control Tower)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const st = p.get("stage");
    if (st && STAGES[st]) setF((x) => ({ ...x, stage: st }));
  }, []);

  const set = (k) => (v) => { setF((x) => ({ ...x, [k]: v })); setPage(1); };
  const clearAll = () => { setF(EMPTY_FILTERS); setQuick("all"); setPage(1); };
  const hasFilters = quick !== "all" || Object.keys(EMPTY_FILTERS).some((k) => f[k] !== EMPTY_FILTERS[k]);

  const clients = useMemo(() => [...new Set(cases.map((c) => c.client))].sort(), [cases]);

  const counts = useMemo(() => ({
    all: cases.length,
    risk: cases.filter((c) => slaState(c.slaMinutes) === "risk").length,
    overdue: cases.filter((c) => slaState(c.slaMinutes) === "overdue").length,
    critical: cases.filter((c) => c.priority === "critical").length,
    qa: cases.filter((c) => c.stage === "qa").length,
  }), [cases]);

  const QUICK = [
    ["all", "All active work", counts.all, "layers", "brand"],
    ["risk", "SLA risk", counts.risk, "clock", "amber"],
    ["overdue", "Overdue", counts.overdue, "alert", "red"],
    ["critical", "Critical priority", counts.critical, "flag", "orange"],
    ["qa", "In QA review", counts.qa, "check", "violet"],
  ];

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return cases.filter((c) => {
      if (quick === "risk" && slaState(c.slaMinutes) !== "risk") return false;
      if (quick === "overdue" && slaState(c.slaMinutes) !== "overdue") return false;
      if (quick === "critical" && c.priority !== "critical") return false;
      if (quick === "qa" && c.stage !== "qa") return false;
      if (f.stage !== "all" && c.stage !== f.stage) return false;
      if (f.client !== "all" && c.client !== f.client) return false;
      if (f.priority !== "all" && c.priority !== f.priority) return false;
      if (f.sla !== "all" && slaState(c.slaMinutes) !== f.sla) return false;
      if (f.from && c.updated < f.from) return false;
      if (f.to && c.updated > f.to) return false;
      if (q && ![c.candidate, c.id, c.client, c.owner ?? ""].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [cases, f, quick]);

  const sorted = useMemo(() => {
    const val = {
      candidate: (c) => c.candidate.toLowerCase(),
      sla: (c) => c.slaMinutes,
      priority: (c) => PRIORITIES[c.priority].rank,
      progress: (c) => c.progress,
      updated: (c) => c.updated,
    }[sort.key];
    return [...filtered].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
  }, [filtered, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const togglePage = () =>
    setSelected((s) => {
      const n = new Set(s);
      rows.forEach((r) => (allOnPage ? n.delete(r.id) : n.add(r.id)));
      return n;
    });
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const SortTh = ({ k, children, className = "" }) => (
    <th className={className} aria-sort={sort.key === k ? (sort.dir > 0 ? "ascending" : "descending") : "none"}>
      <button className="sort-button" onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : 1 }))}>
        {children}
        <span className={`sort-icon ${sort.key === k ? "is-on" : ""}`}>
          <I n={sort.key === k ? (sort.dir > 0 ? "up" : "down") : "sort"} s={13} />
        </span>
      </button>
    </th>
  );

  const show = (k) => visible[k];

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page page-stack cases-page">
          {/* Title */}
          <div className="page-hero">
            <div>
              <p className="hero-eyebrow">Delivery, Head Office</p>
              <h1>Verification register</h1>
              <p className="page-hero-subtitle">
                <strong className="cases-count">{filtered.length}</strong> {filtered.length === 1 ? "case matches" : "cases match"} the current filters
              </p>
            </div>
            <div className="page-hero-actions">
              <ColumnsMenu visible={visible} onToggle={(k) => setVisible((v) => ({ ...v, [k]: !v[k] }))} />
              <button className="button" onClick={() => downloadCsv(sorted, "verification-register.csv")}>
                <I n="download" /> Export
              </button>
            </div>
          </div>

          {/* Quick views as gradient cards */}
          <div className="cases-quick" role="tablist" aria-label="Quick views">
            {QUICK.map(([k, label, n, icon, tone]) => (
              <button
                key={k}
                role="tab"
                aria-selected={quick === k}
                className={`cases-quick-card is-${tone} ${quick === k ? "is-active" : ""}`}
                onClick={() => { setQuick(k); setPage(1); }}
              >
                <span className="cases-quick-icon"><I n={icon} /></span>
                <span className="cases-quick-text">
                  <span>{label}</span>
                  <strong>{n}</strong>
                </span>
              </button>
            ))}
          </div>

          {/* Filters + table */}
          <section className="card cases-card" aria-label="Verification register">
            <div className="cases-filters">
              <label className="search-field">
                <span className="visually-hidden">Search</span>
                <I n="search" />
                <input
                  type="search"
                  value={f.q}
                  onChange={(e) => set("q")(e.target.value)}
                  placeholder="Candidate, case number, client or owner"
                />
              </label>
              <Select label="Stage" value={f.stage} onChange={set("stage")} options={[["all", "All stages"], ...Object.entries(STAGES).map(([k, v]) => [k, v.label])]} />
              <Select label="Client" value={f.client} onChange={set("client")} options={[["all", "All clients"], ...clients.map((c) => [c, c])]} />
              <Select label="Priority" value={f.priority} onChange={set("priority")} options={[["all", "All priorities"], ...Object.entries(PRIORITIES).map(([k, v]) => [k, v.label])]} />
              <Select label="SLA" value={f.sla} onChange={set("sla")} options={[["all", "Any SLA state"], ["overdue", "Overdue"], ["risk", "Due within 24h"], ["ok", "On track"]]} />
              <label className="cases-field">
                <span className="cases-field-label">Updated from</span>
                <input className="date-field" type="date" value={f.from} max={f.to || undefined} onChange={(e) => set("from")(e.target.value)} />
              </label>
              <label className="cases-field">
                <span className="cases-field-label">Updated to</span>
                <input className="date-field" type="date" value={f.to} min={f.from || undefined} onChange={(e) => set("to")(e.target.value)} />
              </label>
              <div className="cases-filters-end">
                {hasFilters && (
                  <button className="clear-filters" onClick={clearAll}><I n="x" s={14} /> Clear filters</button>
                )}
                <span className="cases-hint"><I n="filter" s={13} /> Filters apply to the register and export</span>
              </div>
            </div>

            {selected.size > 0 && (
              <div className="bulk-bar" role="region" aria-label="Bulk actions">
                <strong>{selected.size} selected</strong>
                <button className="button button-light" onClick={() => onAssign([...selected])}><I n="user" /> Assign owner</button>
                <button className="button button-light" onClick={() => downloadCsv(cases.filter((c) => selected.has(c.id)), "selected-cases.csv")}><I n="download" /> Export selected</button>
                <button className="bulk-bar-clear" onClick={() => setSelected(new Set())}>Clear selection</button>
              </div>
            )}

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input type="checkbox" aria-label="Select all on this page" checked={allOnPage} onChange={togglePage} />
                    </th>
                    <SortTh k="candidate">Candidate</SortTh>
                    {show("client") && <th>Client</th>}
                    {show("pkg") && <th>Package</th>}
                    {show("stage") && <th>Stage</th>}
                    {show("progress") && <SortTh k="progress">Progress</SortTh>}
                    {show("priority") && <SortTh k="priority">Priority</SortTh>}
                    {show("sla") && <SortTh k="sla">SLA remaining</SortTh>}
                    {show("owner") && <th>Owner</th>}
                    {show("updated") && <SortTh k="updated">Updated</SortTh>}
                    <th><span className="visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={11} className="table-empty">
                        <I n="search" s={26} />
                        <strong>No cases match these filters</strong>
                        <span>Try a different stage or date range.</span>
                        {hasFilters && <button className="button" onClick={clearAll}>Clear filters</button>}
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => {
                    const st = STAGES[r.stage];
                    const sla = slaState(r.slaMinutes);
                    return (
                      <tr key={r.id} className={selected.has(r.id) ? "is-selected" : ""}>
                        <td className="checkbox-column">
                          <input type="checkbox" aria-label={`Select ${r.candidate}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                        </td>
                        <td>
                          <div className="candidate-cell">
                            <span className={`avatar is-${st.tone}`}>{r.candidate[0].toUpperCase()}</span>
                            <div>
                              <Link to={`/admin/cases/${r.id}`} className="candidate-link">{r.candidate}</Link>
                              <span className="case-id">{r.id}</span>
                            </div>
                          </div>
                        </td>
                        {show("client") && <td className="client-cell">{r.client}</td>}
                        {show("pkg") && (
                          <td>
                            <span className="package-name">{r.pkg}</span>
                            <span className="cell-note">{r.checks} checks</span>
                          </td>
                        )}
                        {show("stage") && <td><span className={`stage-pill is-${st.tone}`}><i />{st.label}</span></td>}
                        {show("progress") && (
                          <td>
                            <span className="progress">
                              <span className="progress-track"><span className={`is-${st.tone}`} style={{ width: `${r.progress}%` }} /></span>
                              <em>{r.progress}%</em>
                            </span>
                          </td>
                        )}
                        {show("priority") && <td><span className={`priority-pill is-${r.priority}`}>{PRIORITIES[r.priority].label}</span></td>}
                        {show("sla") && <td><span className={`sla-pill is-${sla}`}><i />{slaText(r.slaMinutes)}</span></td>}
                        {show("owner") && (
                          <td>
                            {r.owner ? (
                              <span className="owner-name">{r.owner}</span>
                            ) : (
                              <button className="assign-button" onClick={() => onAssign([r.id])}><I n="user" s={13} /> Assign</button>
                            )}
                          </td>
                        )}
                        {show("updated") && <td className="muted-cell">{fmtDate(r.updated)}</td>}
                        <td className="actions-column"><RowMenu row={r} onAssign={onAssign} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="table-footer">
              <span>
                Showing <strong>{sorted.length ? (current - 1) * PAGE_SIZE + 1 : 0}–{Math.min(current * PAGE_SIZE, sorted.length)}</strong> of <strong>{sorted.length}</strong>
              </span>
              <nav className="pagination" aria-label="Pagination">
                <button className="icon-button-small" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page"><I n="left" /></button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`page-button ${p === current ? "is-active" : ""}`} aria-current={p === current ? "page" : undefined} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="icon-button-small" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page"><I n="right" /></button>
              </nav>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}