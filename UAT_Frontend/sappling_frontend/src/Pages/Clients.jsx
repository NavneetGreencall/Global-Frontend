import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Sidebar, SAPLING_LOGO } from "./ControlTower";
import "../Styles/ControlTower.css";
import "../Styles/ReleasedReports.css";
import "../Styles/Clients.css";

/* =====================================================================
   Client management

   The first four clients come from your live page; the last two are
   SAMPLE rows. Pass real data with:
     <Clients clients={items} totalAccounts={9} />

   slaAttainment: percentage, or null when there is no delivery history yet
   activeSinceHours: time since the account became active
   ===================================================================== */

const CLIENTS = [
  { id: "c1", name: "Acme India", code: "ACME", legalName: "Acme India Private Limited", status: "active", activeCases: 3, portfolio: 3, slaAttainment: null, atRisk: 3, contact: "Neha Verma", slaDays: 3, activeSinceHours: 1031 },
  { id: "c2", name: "Acme Tech Solutions", code: "CRM-B15D268CCD4B4F15A263C341", legalName: "Acme Tech Solutions", status: "active", activeCases: 3, portfolio: 3, slaAttainment: null, atRisk: 3, contact: "Rahul Sharma", slaDays: 3, activeSinceHours: 450 },
  { id: "c3", name: "IRFC", code: "CRM-5B09FC207C7C4194B6F5E159", legalName: "IRFC", status: "active", activeCases: 1, portfolio: 1, slaAttainment: null, atRisk: 1, contact: "Singh", slaDays: 3, activeSinceHours: 451 },
  { id: "c4", name: "Navneet Kirana", code: "N0001", legalName: "Navneet", status: "active", activeCases: 5, portfolio: 5, slaAttainment: null, atRisk: 5, contact: null, slaDays: 3, activeSinceHours: 840 },
  // SAMPLE rows below — replace with real data
  { id: "c5", name: "Nikhil Tech", code: "NT01", legalName: "Nikhil Tech", status: "active", activeCases: 2, portfolio: 2, slaAttainment: 100, atRisk: 0, contact: "Nikhil", slaDays: 3, activeSinceHours: 700 },
  { id: "c6", name: "Vision India Pvt Limited.", code: "VIPL", legalName: "Vision India Pvt Limited.", status: "onboarding", activeCases: 2, portfolio: 2, slaAttainment: null, atRisk: 2, contact: null, slaDays: 5, activeSinceHours: 120 },
];

const STATUSES = {
  active: "Active",
  onboarding: "Onboarding",
  paused: "Paused",
};

/* ---------- helpers ---------- */

const since = (h) => {
  const d = Math.floor(h / 24), r = h % 24;
  return d ? `${d}d ${r}h` : `${r}h`;
};

/* ---------- icons ---------- */

const ICONS = {
  building: <><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M10 20.5v-4h4v4" /></>,
  briefcase: <><rect x="3.5" y="7" width="17" height="12.5" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5M12 16h.01" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  down: <path d="M7 10l5 5 5-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  more: <><circle cx="6" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18" cy="12" r="1.3" /></>,
  user: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- the ⋯ menu on each card ---------- */

function CardMenu({ client, onEdit, onPause }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="client-menu" ref={ref}>
      <button
        className="client-menu-button"
        aria-label={`Actions for ${client.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="more" />
      </button>
      {open && (
        <div className="client-menu-list" role="menu">
          <Link role="menuitem" to={`/admin/clients/${client.id}`} onClick={() => setOpen(false)}>Open account detail</Link>
          <button role="menuitem" onClick={() => { onEdit(client); setOpen(false); }}>Edit account</button>
          <button role="menuitem" onClick={() => { onPause(client); setOpen(false); }}>
            {client.status === "paused" ? "Resume account" : "Pause account"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- one client card ---------- */

function ClientCard({ client, onEdit, onPause }) {
  const stats = [
    { label: "Active cases", value: client.activeCases },
    { label: "Portfolio", value: client.portfolio },
    { label: "SLA attainment", value: client.slaAttainment == null ? "No history" : `${client.slaAttainment}%`, muted: client.slaAttainment == null },
    { label: "At risk", value: client.atRisk, warn: client.atRisk > 0 },
  ];

  return (
    <article className="client-card">
      <header className="client-card-top">
        <span className="client-logo"><Icon name="building" size={20} /></span>
        <div className="client-title">
          <Link to={`/admin/clients/${client.id}`} className="client-name">{client.name}</Link>
          <span className="client-code" title={`${client.code} · ${client.legalName}`}>
            {client.code} · {client.legalName}
          </span>
        </div>
        <span className={`status-pill status-${client.status}`}>
          <i />{STATUSES[client.status] ?? client.status}
        </span>
        <CardMenu client={client} onEdit={onEdit} onPause={onPause} />
      </header>

      <dl className="client-stats">
        {stats.map((s) => (
          <div key={s.label} className="client-stat">
            <dt>{s.label}</dt>
            <dd className={s.warn ? "stat-warn" : s.muted ? "stat-muted" : ""}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <footer className="client-card-footer">
        <div className="client-meta">
          <span className="client-contact">
            <Icon name="user" size={13} />
            {client.contact ?? <em>No contact assigned</em>}
            <span className="client-dot">·</span>
            {client.slaDays}-day SLA
          </span>
          <span className="client-since"><Icon name="clock" size={13} />Active {since(client.activeSinceHours)} ago</span>
        </div>
        <Link to={`/admin/clients/${client.id}`} className="client-open-button">
          Open account detail <Icon name="arrow" size={14} />
        </Link>
      </footer>
    </article>
  );
}

/* ---------- page ---------- */

export default function Clients({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  clients = CLIENTS,
  totalAccounts = 9,
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onOnboard = () => console.log("onboard client"),
  onEdit = (c) => console.log("edit", c.id),
  onPause = (c) => console.log("pause", c.id),
  onSearch = (q) => console.log("search", q),
}) {
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("risk");

  const summary = [
    { icon: "building", label: "Client accounts", value: totalAccounts, note: `${clients.filter((c) => c.status === "active").length} active in this list` },
    { icon: "briefcase", label: "Active cases", value: clients.reduce((s, c) => s + c.activeCases, 0), note: "Across all clients" },
    { icon: "alert", label: "Cases at risk", value: clients.reduce((s, c) => s + c.atRisk, 0), note: "Close to or past SLA", alert: true },
    { icon: "user", label: "Without a contact", value: clients.filter((c) => !c.contact).length, note: "Need a primary contact" },
  ];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorters = {
      risk: (a, b) => b.atRisk - a.atRisk || b.activeCases - a.activeCases,
      cases: (a, b) => b.activeCases - a.activeCases,
      name: (a, b) => a.name.localeCompare(b.name),
      newest: (a, b) => a.activeSinceHours - b.activeSinceHours,
    };
    return clients
      .filter((c) => status === "all" || c.status === status)
      .filter((c) => !q || [c.name, c.code, c.legalName, c.contact ?? ""].some((v) => v.toLowerCase().includes(q)))
      .sort(sorters[sort]);
  }, [clients, query, status, sort]);

  const clearFilters = () => { setQuery(""); setStatus("all"); };

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page clients-page">
          {/* Page header */}
          <header className="page-header clients-header">
            <div>
              <p className="page-eyebrow">Stakeholders</p>
              <h1 className="page-title">Client management</h1>
              <p className="page-subtitle">{totalAccounts} client accounts, their workload and delivery health.</p>
            </div>
            <button className="onboard-button" onClick={onOnboard}>
              <Icon name="plus" size={15} /> Onboard client
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

          {/* Toolbar */}
          <div className="clients-toolbar">
            <label className="search-box">
              <span className="visually-hidden">Search clients</span>
              <Icon name="search" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client or primary contact" />
            </label>

            <label className="filter-select">
              <span className="visually-hidden">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Icon name="down" />
            </label>

            <label className="filter-select">
              <span className="visually-hidden">Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="risk">Most at risk first</option>
                <option value="cases">Most active cases</option>
                <option value="newest">Newest accounts</option>
                <option value="name">Name A to Z</option>
              </select>
              <Icon name="down" />
            </label>

            <span className="clients-count">
              Showing <strong>{list.length}</strong> of <strong>{clients.length}</strong> loaded
            </span>
          </div>

          {/* Cards */}
          {list.length === 0 ? (
            <div className="report-library">
              <div className="empty-state">
                <span className="empty-icon"><Icon name="search" size={22} /></span>
                <strong>No client matches</strong>
                <p>Try another name or status.</p>
                <button className="action-button" onClick={clearFilters}>Clear filters</button>
              </div>
            </div>
          ) : (
            <div className="client-grid">
              {list.map((c) => <ClientCard key={c.id} client={c} onEdit={onEdit} onPause={onPause} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}