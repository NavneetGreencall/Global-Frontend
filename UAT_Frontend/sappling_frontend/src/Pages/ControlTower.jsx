import { createContext, Suspense, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import "../Styles/ControlTower.css";
import saplingLogo from "../Assets/sapling-logo.png"; // the logo file

/*
  LOGO: the Sapling Global logo is a separate file, src/assets/sapling-logo.png.
  To change it, replace that file (keep the same name), or point the import
  above at a different image.
*/
export const SAPLING_LOGO = saplingLogo;

/* =====================================================================
   Sample data. Replace with your API data or pass it in as props.
   ===================================================================== */

const NAV = [
  {
    section: "Command",
    items: [
      { id: "control-tower", label: "Control Tower", href: "/admin", icon: "grid" },
      { id: "analytics", label: "Executive Analytics", href: "/admin/analytics", icon: "trend" },
      { id: "sales", label: "Sales & CRM", href: "/admin/sales", icon: "gauge" },
    ],
  },
  {
    section: "Delivery",
    items: [
      { id: "cases", label: "Cases & Delivery", href: "/admin/cases", icon: "list", count: 15 },
      { id: "verifiers", label: "Verifier Operations", href: "/admin/verifier", icon: "check" },
      { id: "qa", label: "QA Review", href: "/admin/qa", icon: "file", count: 2 },
      { id: "exceptions", label: "Exceptions", href: "/admin/exceptions", icon: "alert", count: 9, urgent: true },
      { id: "field", label: "Field Operations", href: "/admin/field", icon: "pin" },
      { id: "reports", label: "Released reports", href: "/admin/reports", icon: "doc" },
    ],
  },
  {
    section: "Stakeholders",
    items: [
      { id: "clients", label: "Clients", href: "/admin/clients", icon: "building" },
      { id: "portfolio", label: "Client Portfolio", href: "/admin/client-portal", icon: "pulse" },
      { id: "finance", label: "Finance & Billing", href: "/admin/finance", icon: "wallet" },
    ],
  },
  {
    section: "Platform",
    items: [
      { id: "users", label: "User IDs & Access", href: "/admin/users", icon: "users" },
      { id: "settings", label: "Platform Settings", href: "/admin/settings", icon: "sliders" },
      { id: "audit", label: "Audit Trail", href: "/admin/audit", icon: "shield" },
      { id: "security", label: "Account Security", href: "/admin/account-security", icon: "key" },
      { id: "privacy", label: "Privacy desk", href: "/admin/privacy", icon: "lock" },
    ],
  },
];

// state: "moving" | "waiting" | "closed" | "clear"
const STAGES = [
  { id: "intake", name: "Case intake", count: 0, state: "clear", oldestHours: 0, atRisk: 0 },
  { id: "consent", name: "Consent", count: 3, state: "waiting", oldestHours: 719, atRisk: 3 },
  { id: "documents", name: "Documents", count: 3, state: "waiting", oldestHours: 523, atRisk: 3 },
  { id: "verification", name: "Verification", count: 7, state: "moving", oldestHours: 692, atRisk: 7 },
  { id: "clarification", name: "Clarification", count: 0, state: "clear", oldestHours: 0, atRisk: 0 },
  { id: "qa", name: "QA review", count: 2, state: "moving", oldestHours: 473, atRisk: 2 },
  { id: "manager_review", name: "Manager approval", count: 0, state: "clear", oldestHours: 0, atRisk: 0 },
  { id: "report", name: "Report preparation", count: 0, state: "clear", oldestHours: 0, atRisk: 0 },
  { id: "payment", name: "Payment & release", count: 0, state: "clear", oldestHours: 0, atRisk: 0 },
  { id: "completed", name: "Completed", count: 1, state: "closed", oldestHours: 500, atRisk: 0 },
];

const QUEUE = [
  {
    id: "SG-20260830-6B1CF5",
    candidate: "Harsh Singh",
    stageId: "consent",
    client: "Acme India",
    waitingHours: 719,
    due: "02 Sept, 12:19 pm",
    critical: true,
    note: "SLA overdue",
    owner: null,
  },
  {
    id: "SG-20260831-D90636",
    candidate: "Avneet",
    stageId: "consent",
    client: "Client name",
    waitingHours: 696,
    due: "01 Sept, 11:36 am",
    critical: true,
    note: "SLA overdue, urgent priority",
    owner: null,
  },
];

const SIGNALS = [
  { id: "client", label: "Client action required", value: 0, href: "/admin/cases?filter=client", icon: "inbox", tone: "amber" },
  { id: "completed", label: "Completed today", value: 0, href: "/admin/reports", icon: "check", tone: "teal" },
  { id: "exceptions", label: "Critical exceptions", value: 9, href: "/admin/exceptions", icon: "alert", tone: "red" },
];

// Invoices created in the last 12 months, current balances
const REVENUE = {
  received: 16520,
  rows: [
    { label: "Billed", value: 16520, tone: "blue" },
    { label: "Payment received", value: 16520, tone: "green" },
    { label: "Payment pending", value: 0, tone: "amber" },
    { label: "Overdue payment", value: 0, tone: "red" },
  ],
};

// Checks on cases initiated in the last 12 months
const RESULTS = { total: 70, pending: 44, clear: 26 };

// Replace with real monthly counts
const INTAKE = [
  { month: "Apr", value: 4 },
  { month: "May", value: 4 },
  { month: "Jun", value: 4 },
  { month: "Jul", value: 4 },
  { month: "Aug", value: 9 },
  { month: "Sep", value: 15 },
];

/* =====================================================================
   Helpers
   ===================================================================== */

const inr = (n) => "₹" + n.toLocaleString("en-IN");

const age = (h) => {
  if (!h) return "—";
  const d = Math.floor(h / 24);
  const r = h % 24;
  return d ? `${d}d ${r}h` : `${r}h`;
};

/* =====================================================================
   Icons (thin line, inherit colour)
   ===================================================================== */

const P = {
  grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  trend: <><path d="M4 16l5-5 4 4 7-7" /><path d="M15 8h5v5" /></>,
  gauge: <><path d="M12 14l3.5-3.5" /><path d="M4 17a8 8 0 1 1 16 0" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r=".8" /><circle cx="4.5" cy="12" r=".8" /><circle cx="4.5" cy="18" r=".8" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  file: <><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" /><path d="M14 3.5V8h4.5" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5M12 16h.01" /></>,
  pin: <><path d="M12 20.5s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z" /><circle cx="12" cy="9.5" r="2.2" /></>,
  doc: <><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" /><path d="M9 13h6M9 16.5h4" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  bell: <><path d="M6.5 9a5.5 5.5 0 0 1 11 0c0 6 2.5 8 2.5 8H4s2.5-2 2.5-8" /><path d="M10.5 20.5a1.7 1.7 0 0 0 3 0" /></>,
  help: <><circle cx="12" cy="12" r="8.5" /><path d="M9.8 9.5a2.3 2.3 0 1 1 3.2 2.1c-.6.3-1 .8-1 1.4M12 16h.01" /></>,
  out: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M9 16l-4-4 4-4M5 12h10" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  down: <path d="M7 10l5 5 5-5" />,
  key: <><circle cx="8" cy="15" r="3.5" /><path d="M10.5 12.5L19 4M15.5 7.5l2.5 2.5M13.5 9.5l2 2" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  building: <><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M10 20.5v-4h4v4" /></>,
  pulse: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  wallet: <><rect x="3.5" y="6" width="17" height="13" rx="2" /><path d="M3.5 10h17M16 14.5h1.5" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  shield: <><path d="M12 3.5l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z" /><path d="M9 12l2 2 4-4" /></>,
  rupee: <><path d="M7 5h10M7 9h10M7 5c5 0 7 1.5 7 4s-2 4-7 4l7 6" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  flame: <path d="M12 21c-3.5 0-6-2.5-6-6 0-3 2-5 3-7 .5 2 1.5 3 2.5 3 0-3 1.5-5.5 4-8 0 4 4.5 6 4.5 11 0 4-3 7-8 7z" />,
  ext: <><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 14v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18V7.5A1.5 1.5 0 0 1 5.5 6H10" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  inbox: <><path d="M4 13l2.5-7h11L20 13v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" /><path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20" /></>,
};

export const Icon = ({ n, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {P[n]}
  </svg>
);

/* =====================================================================
   Sidebar
   ===================================================================== */

function SidebarView({ activeId, logoSrc, orgName, user, open, onClose }) {
  const { pathname } = useLocation();
  return (
    <>
      <div className={`sidebar-overlay ${open ? "is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          {logoSrc && <img className="brand-logo" src={logoSrc} alt="" />}
          <div className="brand-text">
            <span className="brand-name">{orgName}</span>
            <span className="brand-meta">Platform Admin · IST</span>
          </div>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={onClose}>
            <Icon n="x" />
          </button>
        </div>

        <nav className="nav" aria-label="Main">
          {NAV.map((g) => (
            <div className="nav-group" key={g.section}>
              <span className="nav-heading">{g.section}</span>
              {g.items.map((it) => {
                const active = activeId
                  ? it.id === activeId
                  : it.href === "/admin"
                  ? pathname === "/admin" || pathname === "/admin/"
                  : pathname.startsWith(it.href);
                return (
                  <Link
                    key={it.id}
                    to={it.href}
                    onClick={onClose}
                    className={`nav-item ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon n={it.icon} />
                    <span className="nav-label">{it.label}</span>
                    {it.count != null && (
                      <span className={`nav-count ${it.urgent ? "is-urgent" : ""}`}>{it.count}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="user-card">
          <span className="user-avatar">{user.name[0]}</span>
          <div className="user-text">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="icon-button" aria-label="Sign out" onClick={user.onSignOut}>
            <Icon n="out" s={17} />
          </button>
        </div>
      </aside>
    </>
  );
}

/* =====================================================================
   Header
   ===================================================================== */

function HeaderView({ onMenu, onSearch }) {
  const ref = useRef(null);

  useEffect(() => {
    const k = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  return (
    <header className="topbar">
      <button className="icon-button topbar-menu" aria-label="Open menu" onClick={onMenu}>
        <Icon n="menu" />
      </button>
      <form
        className="topbar-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(ref.current.value);
        }}
      >
        <label htmlFor="m-q" className="visually-hidden">Search</label>
        <Icon n="search" s={17} />
        <input id="m-q" ref={ref} type="search" placeholder="Search candidate, case or client" />
        <kbd>Ctrl K</kbd>
      </form>
      <div className="topbar-actions">
        <button className="icon-button" aria-label="Help"><Icon n="help" /></button>
        <button className="icon-button bell-button" aria-label="Notifications">
          <Icon n="bell" />
          <span />
        </button>
      </div>
    </header>
  );
}

/* =====================================================================
   Shared layout

   <AppLayout> draws the sidebar and header ONCE and keeps them on screen
   while pages change underneath (see App.jsx). Pages still render
   <Sidebar> and <Header>, but inside the layout those render nothing, so
   every page also keeps working on its own.
   ===================================================================== */

const ShellContext = createContext(false);

export function Sidebar(props) {
  return useContext(ShellContext) ? null : <SidebarView {...props} />;
}

export function Header(props) {
  return useContext(ShellContext) ? null : <HeaderView {...props} />;
}

function ContentLoader() {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="page-loading-bar" />
      <span className="visually-hidden">Loading page</span>
    </div>
  );
}

export function AppLayout({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onSearch = (q) => console.log("search", q),
}) {
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // New page: close the mobile menu and start at the top
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  // Turn plain <a href="/admin/..."> clicks into in-app navigation (no reload)
  const handleClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  };

  return (
    <ShellContext.Provider value={true}>
      <div className="app app-shell" onClick={handleClick}>
        <SidebarView logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
        <div className="app-main">
          <HeaderView onMenu={() => setMenu(true)} onSearch={onSearch} />
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </ShellContext.Provider>
  );
}

/* =====================================================================
   Page sections
   ===================================================================== */

function Overview({ stages, sla, avgCompletion }) {
  const active = stages.filter((x) => x.state !== "closed").reduce((s, x) => s + x.count, 0);
  const risk = stages.reduce((s, x) => s + x.atRisk, 0);
  const figures = [
    { label: "Active cases", value: active, hint: "All clients and branches", icon: "list", tone: "green" },
    { label: "At risk", value: risk, hint: `Across ${stages.filter((s) => s.atRisk).length} stages`, icon: "alert", tone: "amber" },
    { label: "Average completion", value: avgCompletion, hint: "12-month cohort", icon: "clock", tone: "blue" },
    { label: "SLA health", value: `${sla}%`, hint: "12-month cohort", icon: "shield", tone: "green" },
  ];
  return (
    <div className="tower-figures">
      {figures.map((f) => (
        <div key={f.label} className={`card tower-figure is-${f.tone}`}>
          <div className="tower-figure-top">
            <span className="tower-figure-label">{f.label}</span>
            <span className={`icon-badge is-${f.tone}`}><Icon n={f.icon} s={16} /></span>
          </div>
          <span className={`tower-figure-value ${f.tone === "amber" ? "is-warn" : ""}`}>{f.value}</span>
          <span className="tower-figure-hint">{f.hint}</span>
        </div>
      ))}
    </div>
  );
}

function Pipeline({ stages, selected, onSelect }) {
  const total = Math.max(stages.reduce((s, x) => s + x.count, 0), 1);
  const open = stages.filter((s) => s.state !== "closed");
  const oldest = open.reduce((a, b) => (b.oldestHours > a.oldestHours ? b : a), open[0]);

  return (
    <section className="card section" aria-labelledby="m-pipe">
      <div className="section-head section-head-row">
        <div>
          <h2 id="m-pipe">Verification flow</h2>
          <p>
            Oldest open work has waited <strong>{age(oldest.oldestHours)}</strong> in {oldest.name}. Select a stage to
            filter the action queue.
          </p>
        </div>
        <span className="tower-chip-soft is-red"><Icon n="flame" s={13} /> Bottleneck: {oldest.name}</span>
      </div>

      <div className="tower-bar" aria-hidden="true">
        {stages.filter((s) => s.count).map((s) => (
          <span key={s.id} className={`tower-bar-seg is-${s.state}`} style={{ flexGrow: s.count / total }} />
        ))}
      </div>

      <div className="tower-stages-wrap">
        <ol className="tower-stages">
          {stages.map((s) => {
            const sel = selected === s.id;
            return (
              <li key={s.id}>
                <button
                  className={`tower-stage is-${s.state} ${sel ? "is-selected" : ""} ${s.id === oldest.id ? "is-bottleneck" : ""}`}
                  aria-pressed={sel}
                  disabled={!s.count}
                  onClick={() => onSelect(sel ? null : s.id)}
                >
                  <span className="tower-stage-name">{s.name}</span>
                  <span className="tower-stage-count">{s.count}</span>
                  <span className="tower-stage-state">
                    {{ moving: "In motion", waiting: "Waiting", closed: "Closed", clear: "Clear" }[s.state]}
                    <em>{Math.round((s.count / total) * 100)}%</em>
                  </span>
                  <span className="tower-stage-meta">
                    {s.count === 0 ? "On track" : s.atRisk ? `${s.atRisk} at risk` : "On track"}
                  </span>
                  <span className="tower-stage-age">{s.oldestHours ? `Oldest ${age(s.oldestHours)}` : "\u00a0"}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function AssignButton({ onPick }) {
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

  return (
    <div className="tower-assign" ref={ref}>
      <button className="tower-link-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Assign <Icon n="down" s={15} />
      </button>
      {open && (
        <div className="tower-menu" role="menu">
          <button role="menuitem" onClick={() => { onPick("me"); setOpen(false); }}>Assign to me</button>
          <button role="menuitem" onClick={() => { onPick("choose"); setOpen(false); }}>Choose a verifier…</button>
        </div>
      )}
    </div>
  );
}

function Queue({ rows, stages, stageFilter, onClearStage, onAssign }) {
  const [tab, setTab] = useState("all");
  const stageName = (id) => stages.find((s) => s.id === id)?.name ?? id;

  const list = rows.filter((r) => {
    if (stageFilter && r.stageId !== stageFilter) return false;
    if (tab === "critical") return r.critical;
    if (tab === "unassigned") return !r.owner;
    return true;
  });

  const tabs = [
    ["all", "All", rows.length],
    ["critical", "Critical", rows.filter((r) => r.critical).length],
    ["unassigned", "Unassigned", rows.filter((r) => !r.owner).length],
  ];

  return (
    <section className="card section card-flush" id="queue" aria-labelledby="m-queue">
      <div className="section-head section-head-row">
        <div>
          <h2 id="m-queue">Needs an owner</h2>
          <p>Cases blocked on a person or close to a client deadline, most urgent first.</p>
        </div>
        <a className="more-link" href="/admin/cases?view=queue">
          Full queue <Icon n="arrow" s={15} />
        </a>
      </div>

      <div className="tower-filters">
        <div className="tower-tabs" role="tablist">
          {tabs.map(([k, label, n]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "is-active" : ""} onClick={() => setTab(k)}>
              {label} <span>{n}</span>
            </button>
          ))}
        </div>
        {stageFilter && (
          <button className="tower-chip" onClick={onClearStage}>
            {stageName(stageFilter)} <Icon n="x" s={13} />
            <span className="visually-hidden">Clear stage filter</span>
          </button>
        )}
      </div>

      <div className="tower-table-wrap">
        <table className="tower-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Client</th>
              <th>Stage</th>
              <th className="number-cell">Waiting</th>
              <th>Due</th>
              <th><span className="visually-hidden">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="tower-empty">Nothing here. Every case in this view has an owner.</td>
              </tr>
            )}
            {list.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="tower-candidate-wrap">
                    <span className={`tower-initials ${r.critical ? "is-critical" : ""}`}>
                      {r.candidate.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <div>
                      <a href={`/admin/cases/${r.id}`} className="tower-candidate">{r.candidate}</a>
                      <span className="tower-id">{r.id}</span>
                    </div>
                  </div>
                </td>
                <td>{r.client}</td>
                <td>
                  {stageName(r.stageId)}
                  <span className="tower-note">{r.note}</span>
                </td>
                <td className="number-cell">
                  <span className={`tower-age-pill ${r.critical ? "is-critical" : ""}`}>{age(r.waitingHours)}</span>
                </td>
                <td className="text-muted">{r.due}</td>
                <td className="text-right">
                  <AssignButton onPick={(mode) => onAssign(r.id, mode)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Signals({ items }) {
  return (
    <div className="tower-signals">
      {items.map((s) => (
        <a key={s.id} href={s.href} className={`card tower-signal is-${s.tone}`}>
          <span className={`icon-badge is-${s.tone}`}><Icon n={s.icon} s={16} /></span>
          <div className="tower-signal-text">
            <span className="tower-signal-label">{s.label}</span>
            <span className="tower-signal-value">
              {s.value} <small><i /> Live</small>
            </span>
          </div>
          <Icon n="arrow" s={16} />
        </a>
      ))}
    </div>
  );
}

function Revenue({ data }) {
  const max = Math.max(...data.rows.map((r) => r.value), 1);
  return (
    <section className="card tower-feature is-green" aria-labelledby="m-rev">
      <header className="tower-feature-head">
        <h2 id="m-rev"><span className="icon-badge is-green"><Icon n="rupee" s={16} /></span>Revenue &amp; collections</h2>
        <a className="more-link" href="/admin/finance">Finance <Icon n="ext" s={14} /></a>
      </header>
      <div className="tower-feature-body">
        <div className="tower-revenue-top">
          <div>
            <span className="tower-kicker">Payment received</span>
            <span className="tower-big is-green">{inr(data.received)}</span>
          </div>
          <span className="tower-revenue-scope">Invoices from the last 12 months, current balances</span>
        </div>
        <ul className="tower-meters">
          {data.rows.map((r) => (
            <li key={r.label}>
              <div className="tower-meters-line">
                <span>{r.label}</span>
                <strong>{inr(r.value)}</strong>
              </div>
              <span className="tower-meters-track">
                <span className={`tower-meters-fill is-${r.tone}`} style={{ width: `${(r.value / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
        <p className="tower-footer">Overdue is part of pending. Credits can reduce the balance, and CRM deal value is not payment received.</p>
      </div>
    </section>
  );
}

function Results({ data }) {
  const pPct = Math.round((data.pending / data.total) * 100);
  const cPct = 100 - pPct;
  const R = 46, C = 2 * Math.PI * R;
  return (
    <section className="card tower-feature is-violet" aria-labelledby="tower-results">
      <header className="tower-feature-head">
        <h2 id="tower-results"><span className="icon-badge is-violet"><Icon n="chart" s={16} /></span>Verification results</h2>
        <a className="more-link is-violet" href="/admin/analytics">Analytics <Icon n="ext" s={14} /></a>
      </header>
      <div className="tower-feature-body tower-results">
        <div className="tower-results-ring">
          <svg viewBox="0 0 120 120" role="img" aria-label={`${data.clear} of ${data.total} checks have a recorded result`}>
            <circle cx="60" cy="60" r={R} className="tower-ring-bg" />
            <circle cx="60" cy="60" r={R} className="tower-ring-pending" strokeDasharray={`${(pPct / 100) * C} ${C}`} />
            <circle cx="60" cy="60" r={R} className="tower-ring-clear" strokeDasharray={`${(cPct / 100) * C} ${C}`} strokeDashoffset={-(pPct / 100) * C} />
          </svg>
          <div className="tower-results-center">
            <strong>{data.clear}</strong>
            <span>of {data.total}</span>
          </div>
        </div>
        <div className="tower-results-side">
          <span className="tower-kicker">Checks with a recorded result</span>
          <span className="tower-chip-soft is-amber">{data.pending} pending</span>
          <ul className="tower-results-legend">
            <li><i className="is-amber" />Result pending<strong>{data.pending}</strong><em>{pPct}%</em></li>
            <li><i className="is-green" />Clear<strong>{data.clear}</strong><em>{cPct}%</em></li>
          </ul>
        </div>
      </div>
      <p className="tower-footer tower-footer-pad">Checks on cases initiated in the last 12 months. A recorded result is not final QA approval or report release.</p>
    </section>
  );
}

function Intake({ data }) {
  const [range, setRange] = useState(6);
  const pts = data.slice(-range);
  const max = Math.max(...pts.map((p) => p.value), 1);
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];

  const W = 320, H = 110, pad = 6;
  const x = (i) => pad + (i * (W - pad * 2)) / Math.max(pts.length - 1, 1);
  const y = (v) => H - pad - (v / max) * (H - pad * 2);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");

  return (
    <section className="card section" aria-labelledby="tower-intake">
      <div className="section-head section-head-row">
        <h2 id="tower-intake">Intake</h2>
        <div className="tower-toggle" role="group" aria-label="Range">
          {[3, 6].map((n) => (
            <button key={n} aria-pressed={range === n} className={range === n ? "is-active" : ""} onClick={() => setRange(n)}>
              {n}M
            </button>
          ))}
        </div>
      </div>

      <div className="tower-intake">
        <span className="tower-intake-number">{last.value}</span>
        <span className="tower-intake-text">
          new cases in {last.month}
          {prev && <em>{last.value - prev.value >= 0 ? "+" : ""}{last.value - prev.value} vs {prev.month}</em>}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="tower-spark" role="img" aria-label={pts.map((p) => `${p.month} ${p.value}`).join(", ")}>
        <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} className="tower-spark-base" />
        <path d={d} className="tower-spark-line" />
        <circle cx={x(pts.length - 1)} cy={y(last.value)} r="3.5" className="tower-spark-dot" />
      </svg>
      <div className="tower-spark-labels">
        {pts.map((p) => <span key={p.month}>{p.month}</span>)}
      </div>
    </section>
  );
}

/* =====================================================================
   Page
   ===================================================================== */

export default function ControlTower({
  logoSrc = SAPLING_LOGO, // your logo (see note at top)
  orgName = "Sapling Global",
  stages = STAGES,
  queue = QUEUE,
  signals = SIGNALS,
  revenue = REVENUE,
  results = RESULTS,
  intake = INTAKE,
  sla = 100,
  avgCompletion = "2.6h",
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onAssign = (id, mode) => console.log("assign", id, mode),
  onSearch = (q) => console.log("search", q),
  onRegister = () => console.log("register case"),
}) {
  const [menu, setMenu] = useState(false);
  const [stageFilter, setStageFilter] = useState(null);

  const sorted = useMemo(
    () => [...queue].sort((a, b) => Number(b.critical) - Number(a.critical) || b.waitingHours - a.waitingHours),
    [queue]
  );

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const selectStage = (id) => {
    setStageFilter(id);
    if (id) document.getElementById("queue")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />

      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page">
          <div className="tower-title">
            <div>
              <p className="hero-eyebrow">{today}, Head Office</p>
              <h1>Control Tower</h1>
            </div>
            <button className="button-primary" onClick={onRegister}>Register case</button>
          </div>

          <Overview stages={stages} sla={sla} avgCompletion={avgCompletion} />

          <Signals items={signals} />

          <div className="tower-pair">
            <Revenue data={revenue} />
            <Results data={results} />
          </div>

          <Pipeline stages={stages} selected={stageFilter} onSelect={selectStage} />

          <div className="tower-columns">
            <Queue rows={sorted} stages={stages} stageFilter={stageFilter} onClearStage={() => setStageFilter(null)} onAssign={onAssign} />
            <aside className="tower-aside">
              <Intake data={intake} />
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}