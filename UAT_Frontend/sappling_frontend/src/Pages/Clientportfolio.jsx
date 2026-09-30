import { useState } from "react";
import { Link } from "react-router-dom";
import { Header, Sidebar, SAPLING_LOGO } from "./ControlTower";
import "../Styles/ControlTower.css";
import "../Styles/ReleasedReports.css";
import "../Styles/Clientportfolio.css";

/* =====================================================================
   Client portfolio oversight

   Numbers come from your live page. Pass real data with:
     <ClientPortfolio stats={...} stages={...} responses={...} />

   responses: open client clarifications, one row per organisation, e.g.
     { client: "Acme India", open: 2, oldestHours: 30 }
   ===================================================================== */

const STATS = { activePortfolio: 15, openClarifications: 0, overdueCases: 15, completed: 1, completedToday: 0 };

// In workflow order.
//   color:      the dot and bar colour for that stage
//   casesStage: the stage name the Cases register uses, so clicking a row
//               opens /admin/cases already filtered to that stage
//   done:       true for finished work (not counted as "in flight")
const STAGES = [
  { id: "consent_pending", label: "Consent pending", count: 3, color: "#e0a015", casesStage: "consent" },
  { id: "document_pending", label: "Document pending", count: 3, color: "#f08a24", casesStage: "documents" },
  { id: "in_progress", label: "In progress", count: 7, color: "#2b7fd4", casesStage: "verification" },
  { id: "qa_review", label: "QA review", count: 2, color: "#7552e0", casesStage: "qa" },
  { id: "completed", label: "Completed", count: 1, color: "#22a65a", casesStage: "completed", done: true },
];

const RESPONSES = [];

/* ---------- helpers ---------- */

const age = (h) => {
  const d = Math.floor(h / 24), r = h % 24;
  return d ? `${d}d ${r}h` : `${r}h`;
};

/* ---------- icons ---------- */

const ICONS = {
  layers: <><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></>,
  chat: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9.5h8M8 12.5h5" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- panels ---------- */

function ResponsePressure({ responses }) {
  const most = Math.max(1, ...responses.map((r) => r.open));
  return (
    <section className="portfolio-panel" aria-labelledby="response-title">
      <header className="portfolio-panel-header">
        <div>
          <h2 id="response-title" className="portfolio-panel-title">Response pressure</h2>
          <p className="portfolio-panel-subtitle">Open client clarifications by organisation.</p>
        </div>
      </header>

      {responses.length === 0 ? (
        <div className="response-empty">
          <span className="empty-icon"><Icon name="chat" size={22} /></span>
          <strong>No client response is pending</strong>
          <p>Every clarification sent to clients has been answered.</p>
        </div>
      ) : (
        <ul className="response-list">
          {[...responses].sort((a, b) => b.open - a.open).map((r) => (
            <li key={r.client} className="response-row">
              <div className="response-client">
                <strong>{r.client}</strong>
                <span className="response-age">Oldest waiting {age(r.oldestHours)}</span>
              </div>
              <span className="response-track" aria-hidden="true">
                <span style={{ width: `${(r.open / most) * 100}%` }} />
              </span>
              <span className="response-count">{r.open}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StageMix({ stages }) {
  const total = stages.reduce((s, x) => s + x.count, 0) || 1;
  const inFlight = stages.filter((s) => !s.done).reduce((n, s) => n + s.count, 0);
  const finished = total - inFlight;
  const most = Math.max(1, ...stages.map((s) => s.count));
  return (
    <section className="portfolio-panel" aria-labelledby="stage-title">
      <header className="portfolio-panel-header">
        <div>
          <h2 id="stage-title" className="portfolio-panel-title">Portfolio stage mix</h2>
          <p className="portfolio-panel-subtitle">Live case volume across client-facing workflow states.</p>
        </div>
        <span className="stage-total">
          <strong>{inFlight}</strong> in flight{finished > 0 && <>, <strong>{finished}</strong> completed</>}
        </span>
      </header>

      {/* One bar split by stage */}
      <div className="stage-bar" role="img" aria-label={stages.map((s) => `${s.label} ${s.count}`).join(", ")}>
        {stages.filter((s) => s.count > 0).map((s) => (
          <span
            key={s.id}
            className="stage-bar-segment"
            style={{ flexGrow: s.count, background: s.color }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>

      {/* One row per stage */}
      <ul className="stage-list">
        {stages.map((s) => (
          <li key={s.id}>
            <Link to={s.casesStage ? `/admin/cases?stage=${s.casesStage}` : "/admin/cases"} className="stage-row">
              <span className="stage-dot" style={{ background: s.color }} />
              <span className="stage-name">{s.label}</span>
              <span className="stage-track" aria-hidden="true">
                <span className="stage-track-fill" style={{ width: `${(s.count / most) * 100}%`, background: s.color }} />
              </span>
              <span className="stage-share">{Math.round((s.count / total) * 100)}%</span>
              <span className="stage-count">{s.count}</span>
              <Icon name="arrow" size={14} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- page ---------- */

export default function ClientPortfolio({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  stats = STATS,
  stages = STAGES,
  responses = RESPONSES,
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onSearch = (q) => console.log("search", q),
}) {
  const [menu, setMenu] = useState(false);

  const summary = [
    { icon: "layers", label: "Active portfolio", value: stats.activePortfolio, note: "Cases in flight" },
    { icon: "chat", label: "Client response", value: stats.openClarifications, note: "Open clarifications" },
    { icon: "clock", label: "SLA exposure", value: stats.overdueCases, note: "Overdue cases", alert: stats.overdueCases > 0 },
    { icon: "check", label: "Completed", value: stats.completed, note: `${stats.completedToday} today` },
  ];

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page portfolio-page">
          <header className="page-header">
            <p className="page-eyebrow">Stakeholders</p>
            <h1 className="page-title">Client portfolio oversight</h1>
            <p className="page-subtitle">How client work is moving, where clients owe a response, and what is overdue.</p>
          </header>

          <div className="summary-cards">
            {summary.map((s) => (
              <div key={s.label} className={`summary-card ${s.alert ? "summary-card-alert" : ""}`}>
                <div className="summary-card-top">
                  <span className="summary-card-label">{s.label}</span>
                  <span className="summary-card-icon"><Icon name={s.icon} /></span>
                </div>
                <strong className="summary-card-value">{s.value}</strong>
                <span className="summary-card-note">{s.note}</span>
              </div>
            ))}
          </div>

          <div className="portfolio-grid">
            <ResponsePressure responses={responses} />
            <StageMix stages={stages} />
          </div>
        </main>
      </div>
    </div>
  );
}