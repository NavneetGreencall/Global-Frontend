import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Header, Sidebar, SAPLING_LOGO } from "@/layout";
import { SAMPLE_USER } from "@/sample-data/user";
import { STATS, ITEMS } from "@/sample-data/exceptions";
import { Pagination, usePagination } from "@/components/ui";
import type { ShellProps } from "@/layout";

/* =====================================================================
   Data from your current Exceptions page. The first four exceptions are
   real; the rest are SAMPLE rows showing other categories and severities.
   Pass your real list with <Exceptions items={...} stats={...} />.

   ageHours: time since the exception was raised
   ===================================================================== */

/* ---------- data types ---------- */

export type Severity = "critical" | "high" | "medium" | "low";

export interface ExceptionStats {
  open: number;
  uniqueCases: number;
  critical: number;
  avgAgeHours: number;
  resolvedToday: number;
}

/** ageHours: time since the exception was raised */
export interface ExceptionItem {
  id: string;
  caseId: string;
  candidate: string;
  client: string;
  severity: Severity;
  category: string; // key of CATEGORY, e.g. "sla"
  overdue: boolean;
  issue: string;
  owner: string;
  ageHours: number;
}

type SeverityFilter = Severity | "all";

const SEVERITY: Record<Severity, { label: string; rank: number }> = {
  critical: { label: "Critical", rank: 4 },
  high: { label: "High", rank: 3 },
  medium: { label: "Medium", rank: 2 },
  low: { label: "Low", rank: 1 },
};

const CATEGORY: Record<string, string> = {
  sla: "SLA breach",
  discrepancy: "Discrepancy",
  documents: "Documents",
  consent: "Consent",
  clarification: "Client clarification",
  field: "Field visit",
};

/* =====================================================================
   Helpers + icons
   ===================================================================== */

const age = (h: number) => {
  const d = Math.floor(h / 24), r = h % 24;
  return d ? `${d}d ${r}h` : `${r}h`;
};

const IP: Record<string, ReactNode> = {
  layers: <><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5M12 16h.01" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  down: <path d="M7 10l5 5 5-5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};
const I = ({ n, s = 16 }: { n: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {IP[n]}
  </svg>
);

/* =====================================================================
   Exception row
   ===================================================================== */

interface ExceptionRowProps {
  x: ExceptionItem;
  oldest: number;
  onResolve: (id: string) => void;
  onAssign: (id: string) => void;
}

function ExceptionRow({ x, oldest, onResolve, onAssign }: ExceptionRowProps) {
  const sev = SEVERITY[x.severity] ?? SEVERITY.low;
  const pct = Math.max(4, Math.round((x.ageHours / oldest) * 100));
  return (
    <li className={`list-row is-${x.severity}`}>
      <div className="row-person">
        <span className="row-avatar">{x.candidate[0].toUpperCase()}</span>
        <div className="row-person-text">
          <div className="row-title-line">
            <Link to={`/admin/cases/${x.caseId}`} className="row-name">{x.candidate}</Link>
            <span className="severity-pill"><i />{sev.label}</span>
            {x.overdue && <span className="overdue-tag">Overdue</span>}
          </div>
          <span className="row-meta"><span className="row-id">{x.caseId}</span> · {x.client}</span>
        </div>
      </div>

      <div className="row-cell">
        <span className="row-label">Issue</span>
        <span className="row-issue">{x.issue}</span>
        <span className="row-category">{CATEGORY[x.category] ?? x.category}</span>
      </div>

      <div className="row-cell row-owner">
        <span className="row-label">Owner</span>
        <span className="row-value">{x.owner}</span>
      </div>

      <div className="row-cell">
        <span className="row-label">Raised</span>
        <span className="row-value">{age(x.ageHours)} ago</span>
        <span className="row-age-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      </div>

      <div className="row-actions">
        <button className="row-button" onClick={() => onAssign(x.id)}>Reassign</button>
        <button className="row-button is-primary" onClick={() => onResolve(x.id)}>Resolve</button>
        <Link to={`/admin/cases/${x.caseId}`} className="row-open" aria-label={`Open case ${x.caseId}`}><I n="arrow" s={15} /></Link>
      </div>
    </li>
  );
}

/* =====================================================================
   Page
   ===================================================================== */

interface ExceptionsProps extends ShellProps {
  stats?: ExceptionStats;
  items?: ExceptionItem[];
  onResolve?: (id: string) => void;
  onAssign?: (id: string) => void;
}

export default function Exceptions({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  stats = STATS,
  items = ITEMS,
  user = SAMPLE_USER,
  onResolve = (id: string) => console.log("resolve", id),
  onAssign = (id: string) => console.log("reassign", id),
  onSearch = (q: string) => console.log("search", q),
}: ExceptionsProps) {
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sev, setSev] = useState<SeverityFilter>("all");

  const oldest = Math.max(...items.map((x) => x.ageHours), 1);

  const bySeverity = useMemo(() => {
    const c: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    items.forEach((x) => (c[x.severity] = (c[x.severity] ?? 0) + 1));
    return c;
  }, [items]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items
      .filter((x) => (cat === "all" || x.category === cat) && (sev === "all" || x.severity === sev))
      .filter((x) => !s || [x.candidate, x.caseId, x.client, x.issue].some((v) => v.toLowerCase().includes(s)))
      .sort((a, b) => (SEVERITY[b.severity]?.rank ?? 0) - (SEVERITY[a.severity]?.rank ?? 0) || b.ageHours - a.ageHours);
  }, [items, q, cat, sev]);

  const paged = usePagination(list, 10, [q, cat, sev]);

  const kpis = [
    { label: "Open exceptions", value: stats.open, hint: `${stats.uniqueCases} unique cases`, icon: "layers", cls: "is-leaf" },
    { label: "Critical", value: stats.critical, hint: "Requires immediate control", icon: "alert", cls: "is-leaf is-alert" },
    { label: "Average age", value: `${stats.avgAgeHours}h`, hint: `About ${Math.round(stats.avgAgeHours / 24)} days across the backlog`, icon: "clock", cls: "is-leaf" },
    { label: "Resolved today", value: stats.resolvedToday, hint: "Closed since start of day", icon: "check", cls: "is-leaf" },
  ];

  const sevChips: [SeverityFilter, string, number][] = [
    ["all", "All", items.length],
    ["critical", "Critical", bySeverity.critical],
    ["high", "High", bySeverity.high],
    ["medium", "Medium", bySeverity.medium],
    ["low", "Low", bySeverity.low],
  ];

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page page-stack">
          <div className="page-hero">
            <div>
              <p className="hero-eyebrow">Delivery, Head Office</p>
              <h1>Exception oversight</h1>
              <p className="page-hero-subtitle">Everything blocked across workspaces, critical items first.</p>
            </div>
          </div>

          <div className="stat-cards">
            {kpis.map((k) => (
              <div key={k.label} className={`stat-card ${k.cls}`}>
                <div className="stat-card-top">
                  <span>{k.label}</span>
                  <span className="stat-card-icon"><I n={k.icon} /></span>
                </div>
                <strong>{k.value}</strong>
                <small>{k.hint}</small>
              </div>
            ))}
          </div>

          <section className="card list-card" aria-labelledby="ex-title">
            <header className="list-header">
              <div className="list-title">
                <h2 id="ex-title">Cross-workspace attention queue <span className="count-pill">{list.length}</span></h2>
                <p>Critical items first, then the oldest high-risk work.</p>
              </div>
              <div className="list-tools">
                <label className="search-field list-search">
                  <span className="visually-hidden">Search exceptions</span>
                  <I n="search" />
                  <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exception or case" />
                </label>
                <span className="select-field">
                  <label htmlFor="ex-cat" className="visually-hidden">Category</label>
                  <select id="ex-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
                    <option value="all">All categories</option>
                    {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <I n="down" />
                </span>
              </div>
            </header>

            <div className="filter-tabs" role="tablist" aria-label="Severity">
              {sevChips.map(([k, label, n]) => (
                <button key={k} role="tab" aria-selected={sev === k} className={`is-${k} ${sev === k ? "is-active" : ""}`} onClick={() => setSev(k)}>
                  {k !== "all" && <i />}{label}<span>{n}</span>
                </button>
              ))}
            </div>

            {list.length === 0 ? (
              <div className="list-empty">
                <span className="list-empty-icon"><I n="check" s={22} /></span>
                <strong>No exceptions match</strong>
                <span>Try another category or severity, or clear the search.</span>
                <button className="button" onClick={() => { setQ(""); setCat("all"); setSev("all"); }}>Clear filters</button>
              </div>
            ) : (
              <ul className="row-list">
                {paged.items.map((x) => (
                  <ExceptionRow key={x.id} x={x} oldest={oldest} onResolve={onResolve} onAssign={onAssign} />
                ))}
              </ul>
            )}

            <Pagination {...paged.props} itemLabel="exceptions" />
          </section>
        </main>
      </div>
    </div>
  );
}
