import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Sidebar, SAPLING_LOGO } from "./ControlTower";
import "../Styles/ControlTower.css";
import "../Styles/ExecutiveAnalytics.css";
import "../Styles/CaseRegister.css";
import "../Styles/QAReview.css";

/* =====================================================================
   Your QA queue is currently empty, so the default is [].
   Each item looks like SAMPLE_QA below. Pass real data with
   <QAReview queue={items} />  (keep the order your backend returns).
   ===================================================================== */

export const SAMPLE_QA = [
  { id: "SG-20260922-B4C5D6", candidate: "Rohit Mehra", client: "Nikhil Tech", risk: "high", reviewer: null, hoursAtGate: 5, dueMinutes: 300, discrepancies: 2 },
  { id: "SG-20260921-C7D8E9", candidate: "Priya Nair", client: "Vision India Pvt Limited.", risk: "medium", reviewer: "Verification Specialist", hoursAtGate: 20, dueMinutes: -90, discrepancies: 1 },
];

const RISK = {
  high: { label: "High risk", tone: "red" },
  medium: { label: "Medium", tone: "amber" },
  low: { label: "Low", tone: "green" },
};

const PAGE_SIZE = 10;

const IP = {
  doc: <><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" /><path d="M14 3.5V8h4.5" /><path d="M9.5 14.5l2 2 3.5-4" /></>,
  shield: <><path d="M12 3.5l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z" /><path d="M9 12l2 2 4-4" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5M12 16h.01" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  user: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
};
const I = ({ n, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {IP[n]}
  </svg>
);

const dur = (mins) => {
  const m = Math.abs(mins);
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  return d ? `${d}d ${h}h` : h ? `${h}h ${mm}m` : `${mm}m`;
};

function EmptyState({ searching, onClear }) {
  return (
    <div className="qa-empty">
      <div className="qa-empty-art" aria-hidden="true">
        <span className="qa-empty-ring" />
        <span className="qa-empty-ring qa-empty-ring-2" />
        <span className="qa-empty-icon"><I n="shield" s={26} /></span>
      </div>
      <strong>{searching ? "No case matches this search" : "The QA gate is clear"}</strong>
      <span>
        {searching
          ? "Check the case number or candidate name and try again."
          : "No cases are waiting for review. New cases appear here as soon as verification finishes."}
      </span>
      {searching && <button className="button" onClick={onClear}>Clear search</button>}
    </div>
  );
}

export default function QAReview({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  queue = [],
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onSearch = (q) => console.log("search", q),
}) {
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  const counts = {
    all: queue.length,
    unclaimed: queue.filter((x) => !x.reviewer).length,
    claimed: queue.filter((x) => x.reviewer).length,
    high: queue.filter((x) => x.risk === "high").length,
    overdue: queue.filter((x) => x.dueMinutes < 0).length,
  };

  const kpis = [
    { label: "Awaiting review", value: counts.all, hint: "Cases at the QA gate", icon: "doc", cls: "is-violet" },
    { label: "Claimed", value: counts.claimed, hint: "Owned by a reviewer", icon: "shield", cls: "is-brand" },
    { label: "High risk", value: counts.high, hint: "Needs careful sign-off", icon: "flag", cls: "is-orange" },
    { label: "Overdue", value: counts.overdue, hint: "Past committed due date", icon: "clock", cls: "is-red" },
  ];

  const tabs = [
    ["all", "All", counts.all],
    ["unclaimed", "Unclaimed", counts.unclaimed],
    ["claimed", "Claimed", counts.claimed],
    ["high", "High risk", counts.high],
    ["overdue", "Overdue", counts.overdue],
  ];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return queue.filter((x) => {
      if (tab === "unclaimed" && x.reviewer) return false;
      if (tab === "claimed" && !x.reviewer) return false;
      if (tab === "high" && x.risk !== "high") return false;
      if (tab === "overdue" && x.dueMinutes >= 0) return false;
      if (s && ![x.id, x.candidate, x.client].some((v) => v.toLowerCase().includes(s))) return false;
      return true;
    });
  }, [queue, q, tab]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page page-stack">
          <div className="page-hero">
            <div>
              <p className="hero-eyebrow">Delivery, Head Office</p>
              <h1>QA review oversight</h1>
              <p className="page-hero-subtitle">Cases waiting for quality sign-off before report release.</p>
            </div>
            <span className="qa-readonly"><I n="eye" s={14} /> Read-only platform view</span>
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

          <section className="card qa-card" aria-labelledby="qa-title">
            <header className="qa-head">
              <div>
                <h2 id="qa-title">Review queue <span className="verifier-count qa-count">{filtered.length}</span></h2>
                <p>Ordered by backend review priority.</p>
              </div>
              <label className="search-field qa-search">
                <span className="visually-hidden">Search QA queue</span>
                <I n="search" />
                <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search case or candidate" />
              </label>
            </header>

            <div className="qa-tabs" role="tablist" aria-label="Queue filter">
              {tabs.map(([k, label, n]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "is-active" : ""} onClick={() => { setTab(k); setPage(1); }}>
                  {label} <span>{n}</span>
                </button>
              ))}
            </div>

            {rows.length === 0 ? (
              <EmptyState searching={!!q.trim() || tab !== "all"} onClear={() => { setQ(""); setTab("all"); }} />
            ) : (
              <div className="qa-table-wrap">
                <table className="data-table qa-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Client</th>
                      <th>Risk</th>
                      <th>Reviewer</th>
                      <th>At QA gate</th>
                      <th>Due</th>
                      <th>Discrepancies</th>
                      <th><span className="visually-hidden">Open</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((x) => {
                      const r = RISK[x.risk] ?? RISK.low;
                      return (
                        <tr key={x.id}>
                          <td>
                            <div className="candidate-cell">
                              <span className="avatar is-violet">{x.candidate[0].toUpperCase()}</span>
                              <div>
                                <Link to={`/admin/cases/${x.id}`} className="candidate-link">{x.candidate}</Link>
                                <span className="case-id">{x.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="client-cell">{x.client}</td>
                          <td><span className={`qa-risk is-${r.tone}`}><i />{r.label}</span></td>
                          <td>
                            {x.reviewer ? (
                              <span className="qa-reviewer"><I n="user" s={13} />{x.reviewer}</span>
                            ) : (
                              <span className="qa-unclaimed">Unclaimed</span>
                            )}
                          </td>
                          <td className="muted-cell">{x.hoursAtGate}h</td>
                          <td>
                            <span className={`sla-pill ${x.dueMinutes < 0 ? "is-overdue" : x.dueMinutes < 1440 ? "is-risk" : "is-ok"}`}>
                              <i />{x.dueMinutes < 0 ? `Overdue by ${dur(x.dueMinutes)}` : `${dur(x.dueMinutes)} left`}
                            </span>
                          </td>
                          <td>
                            <span className={`qa-discrepancy ${x.discrepancies ? "is-on" : ""}`}>{x.discrepancies}</span>
                          </td>
                          <td className="actions-column">
                            <Link to={`/admin/cases/${x.id}`} className="qa-open" aria-label={`Open ${x.candidate}`}><I n="right" /></Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <footer className="table-footer">
              <span>Page <strong>{current}</strong> of <strong>{pages}</strong></span>
              <nav className="pagination" aria-label="Pagination">
                <button className="qa-page-button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page"><I n="left" /></button>
                <button className="qa-page-button" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page"><I n="right" /></button>
              </nav>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}