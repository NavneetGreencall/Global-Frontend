import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Sidebar, SAPLING_LOGO } from "./ControlTower";
import "../Styles/ControlTower.css";
import "../Styles/ExecutiveAnalytics.css";
import "../Styles/CaseRegister.css";
import "../Styles/VerifierOperations.css";

/* =====================================================================
   Data from your current Verifier Operations page.
   Replace with API data or pass as props.
   ===================================================================== */

const VERIFIERS = [
  { id: "v1", name: "Verifier", branch: null, active: 8, overdue: 0, doneToday: 0 },
  { id: "v2", name: "Verification Specialist", branch: "Head Office", active: 0, overdue: 0, doneToday: 0 },
  { id: "v3", name: "Verifier", branch: "Head Office", active: 0, overdue: 0, doneToday: 0 },
  { id: "v4", name: "Verifier", branch: null, active: 0, overdue: 0, doneToday: 0 },
];

const UNALLOCATED = 36; // checks without an owner

/* =====================================================================
   Icons
   ===================================================================== */

const IP = {
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
  clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 10h6M9 14h6M9 18h3" /></>,
  inbox: <><path d="M4 13l2.5-7h11L20 13v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" /><path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5M12 16h.01" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  down: <path d="M7 10l5 5 5-5" />,
  more: <><circle cx="6" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18" cy="12" r="1.3" /></>,
  pin: <><path d="M12 20.5s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z" /><circle cx="12" cy="9.5" r="2.2" /></>,
  split: <><path d="M6 4v5a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v5" /><path d="M15 17l3 3 3-3" /><path d="M3 7l3-3 3 3" /></>,
  bolt: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />,
  plus: <path d="M12 5v14M5 12h14" />,
};
const I = ({ n, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {IP[n]}
  </svg>
);

const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const loadTone = (pct) => (pct >= 85 ? "high" : pct >= 50 ? "mid" : pct > 0 ? "low" : "idle");

function RowMenu({ v, onAllocate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const off = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="menu-wrap" ref={ref}>
      <button className="icon-button-small" aria-label={`Actions for ${v.name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <I n="more" />
      </button>
      {open && (
        <div className="menu" role="menu">
          <Link role="menuitem" to={`/admin/cases?owner=${v.id}`} onClick={() => setOpen(false)}>View queue</Link>
          <button role="menuitem" onClick={() => { onAllocate([v.id]); setOpen(false); }}>Allocate checks</button>
          <button role="menuitem" onClick={() => setOpen(false)}>Assign branch</button>
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   Page
   ===================================================================== */

export default function VerifierOperations({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  verifiers = VERIFIERS,
  unallocated = UNALLOCATED,
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onAllocate = (ids) => console.log("allocate checks to", ids),
  onAutoBalance = () => console.log("auto-balance"),
  onSearch = (q) => console.log("search", q),
}) {
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const [view, setView] = useState("all");

  const maxActive = Math.max(...verifiers.map((v) => v.active), 1);
  const withLoad = verifiers.map((v) => ({ ...v, load: Math.round((v.active / maxActive) * 100) }));

  const totals = {
    accounts: verifiers.length,
    inFlight: verifiers.reduce((s, v) => s + v.active, 0),
    overdue: verifiers.reduce((s, v) => s + v.overdue, 0),
    done: verifiers.reduce((s, v) => s + v.doneToday, 0),
    idle: verifiers.filter((v) => v.active === 0).length,
    noBranch: verifiers.filter((v) => !v.branch).length,
  };

  const branches = useMemo(() => {
    const m = new Map();
    verifiers.forEach((v) => {
      const k = v.branch ?? "No branch assigned";
      const b = m.get(k) ?? { name: k, count: 0, active: 0, missing: !v.branch };
      b.count += 1;
      b.active += v.active;
      m.set(k, b);
    });
    return [...m.values()].sort((a, b) => a.missing - b.missing || b.count - a.count);
  }, [verifiers]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return withLoad
      .filter((v) => {
        if (s && ![v.name, v.branch ?? "no branch"].some((x) => x.toLowerCase().includes(s))) return false;
        if (view === "overdue") return v.overdue > 0;
        if (view === "busy") return v.load >= 85;
        if (view === "idle") return v.active === 0;
        if (view === "nobranch") return !v.branch;
        return true;
      })
      .sort((a, b) => b.overdue - a.overdue || b.active - a.active);
  }, [withLoad, q, view]);

  const kpis = [
    { label: "Verifier accounts", value: totals.accounts, hint: "Available in this tenant", icon: "users", cls: "is-brand" },
    { label: "Checks in flight", value: totals.inFlight, hint: "Across verifier queues", icon: "clipboard", cls: "is-teal" },
    { label: "Awaiting allocation", value: unallocated, hint: "Checks without an owner", icon: "inbox", cls: "is-orange" },
    { label: "Overdue checks", value: totals.overdue, hint: totals.overdue ? "Needs operations attention" : "Nothing overdue right now", icon: "alert", cls: totals.overdue ? "is-red" : "is-violet" },
  ];

  const perIdle = totals.idle ? Math.ceil(unallocated / totals.idle) : 0;

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page page-stack">
          <div className="page-hero">
            <div>
              <p className="hero-eyebrow">Delivery, Head Office</p>
              <h1>Verifier operations</h1>
              <p className="page-hero-subtitle">Verifier capacity, queue load and checks waiting for an owner.</p>
            </div>
            <div className="page-hero-actions">
              <button className="button-primary verifier-action" onClick={() => onAllocate([])}>
                <I n="plus" s={15} /> Allocate checks
              </button>
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

          <div className="verifier-grid">
            {/* Workload queue */}
            <section className="card verifier-queue" aria-labelledby="vo-q">
              <header className="verifier-queue-head">
                <div>
                  <h2 id="vo-q">
                    Workload and risk queue <span className="verifier-count">{list.length}</span>
                  </h2>
                  <p>Highest overdue and highest-load verifiers appear first.</p>
                </div>
                <div className="verifier-tools">
                  <label className="search-field verifier-search">
                    <span className="visually-hidden">Search verifiers</span>
                    <I n="search" />
                    <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search verifier or branch" />
                  </label>
                  <span className="select-field">
                    <label htmlFor="vo-view" className="visually-hidden">Filter workload</label>
                    <select id="vo-view" value={view} onChange={(e) => setView(e.target.value)}>
                      <option value="all">All workload</option>
                      <option value="overdue">Has overdue</option>
                      <option value="busy">Near capacity</option>
                      <option value="idle">No active checks</option>
                      <option value="nobranch">No branch assigned</option>
                    </select>
                    <I n="down" />
                  </span>
                </div>
              </header>

              <div className="verifier-columns" aria-hidden="true">
                <span>Verifier</span>
                <span>Active</span>
                <span>Overdue</span>
                <span>Done today</span>
                <span>Relative load</span>
                <span />
              </div>

              <ul className="verifier-list">
                {list.length === 0 && (
                  <li className="verifier-empty">
                    <I n="search" s={24} />
                    <strong>No verifiers match</strong>
                    <span>Try another search or filter.</span>
                  </li>
                )}
                {list.map((v) => {
                  const tone = loadTone(v.load);
                  return (
                    <li key={v.id} className={`verifier-row is-${tone}`}>
                      <div className="verifier-person">
                        <span className={`verifier-avatar is-${tone}`}>{initials(v.name)}</span>
                        <div>
                          <span className="verifier-name">{v.name}</span>
                          {v.branch ? (
                            <span className="verifier-branch"><I n="pin" s={12} />{v.branch}</span>
                          ) : (
                            <span className="verifier-branch is-missing"><I n="pin" s={12} />No branch assigned</span>
                          )}
                        </div>
                      </div>
                      <div className="verifier-stat" data-label="Active"><strong>{v.active}</strong></div>
                      <div className="verifier-stat" data-label="Overdue"><strong className={v.overdue ? "verifier-red" : ""}>{v.overdue}</strong></div>
                      <div className="verifier-stat" data-label="Done today"><strong>{v.doneToday}</strong></div>
                      <div className="verifier-load" data-label="Relative load">
                        <span className="verifier-load-track"><span className={`is-${tone}`} style={{ width: `${v.load}%` }} /></span>
                        <em>{v.load}%</em>
                      </div>
                      <div className="verifier-actions"><RowMenu v={v} onAllocate={onAllocate} /></div>
                    </li>
                  );
                })}
              </ul>

              <footer className="verifier-legend">
                <span><i className="is-high" />Near capacity</span>
                <span><i className="is-mid" />Busy</span>
                <span><i className="is-low" />Light</span>
                <span><i className="is-idle" />Idle</span>
                <em>Load is relative to the busiest verifier.</em>
              </footer>
            </section>

            {/* Side column */}
            <div className="verifier-side">
              <section className="card verifier-allocation" aria-labelledby="verifier-allocation">
                <div className="verifier-allocation-top">
                  <span className="verifier-allocation-icon"><I n="split" s={18} /></span>
                  <div>
                    <h2 id="verifier-allocation">Allocation</h2>
                    <p>Checks waiting for a verifier.</p>
                  </div>
                </div>
                <div className="verifier-allocation-number">
                  <strong>{unallocated}</strong>
                  <span>unallocated checks</span>
                </div>
                <div className="verifier-capacity">
                  <div><span>Idle verifiers</span><strong>{totals.idle}</strong></div>
                  <div><span>Busiest queue</span><strong>{maxActive}</strong></div>
                  <div><span>Done today</span><strong>{totals.done}</strong></div>
                </div>
                {totals.idle > 0 && unallocated > 0 && (
                  <p className="verifier-tip">
                    <I n="bolt" s={14} />
                    <span>
                      {totals.idle} {totals.idle === 1 ? "verifier has" : "verifiers have"} no active checks. Spreading the backlog evenly gives each about <strong>{perIdle}</strong>.
                    </span>
                  </p>
                )}
                <button className="verifier-balance" onClick={onAutoBalance}>
                  <I n="split" s={15} /> Auto-balance queues
                </button>
              </section>

              <section className="card verifier-branches" aria-labelledby="vo-br">
                <header>
                  <h2 id="vo-br">Branch coverage</h2>
                  <p>Verifier accounts by operating location.</p>
                </header>
                <ul>
                  {branches.map((b) => (
                    <li key={b.name} className={b.missing ? "is-missing" : ""}>
                      <span className="verifier-branches-icon"><I n="pin" s={14} /></span>
                      <span className="verifier-branches-name">
                        {b.name}
                        <small>{b.active} active checks</small>
                      </span>
                      <strong>{b.count}</strong>
                    </li>
                  ))}
                </ul>
                {totals.noBranch > 0 && (
                  <div className="callout">
                    <I n="alert" s={16} />
                    <span>{totals.noBranch} verifier {totals.noBranch === 1 ? "account has" : "accounts have"} no branch, so branch reports won't include their work.</span>
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}