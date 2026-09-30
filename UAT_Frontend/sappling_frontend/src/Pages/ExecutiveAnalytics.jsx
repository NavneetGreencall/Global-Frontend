import { useMemo, useRef, useState } from "react";
import { Header, Sidebar, SAPLING_LOGO } from "./ControlTower";
import "../Styles/ControlTower.css";
import "../Styles/ExecutiveAnalytics.css";

/* =====================================================================
   Sample data taken from your current Executive Analytics page.
   Replace with API data or pass everything in as props.
   ===================================================================== */

// Daily series for the selected window (31 Aug to 28 Sept)
const buildDays = () => {
  const intake = { 7: 2, 8: 2, 11: 1, 12: 1, 13: 1, 15: 1, 24: 1, 26: 1 };
  const done = { 8: 1 };
  const out = [];
  const start = new Date(2026, 7, 31);
  for (let i = 0; i < 29; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.getMonth() === 8 ? d.getDate() : -1;
    out.push({
      date: d,
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      intake: intake[key] ?? 0,
      completed: done[key] ?? 0,
    });
  }
  return out;
};
const DAILY = buildDays();

// Set a target (e.g. target: 95) to show it on the card
const SLA = { value: 100, measured: 1, target: null, lastPoint: "08 Sept" };
const TURNAROUND = { value: 2.6, unit: "h", measured: 1, lastPoint: "08 Sept", target: null };

const OUTCOMES = [
  { label: "Unclassified", value: 6, color: "#64748b" },
  { label: "Low", value: 4, color: "#22a65a" },
  { label: "Medium", value: 1, color: "#f08a24" },
  { label: "High", value: 0, color: "#d64545" },
];

const CLIENTS = [
  { name: "Acme Tech Solutions", volume: 3, sla: null, tat: null, overdue: 100 },
  { name: "Acme India", volume: 2, sla: null, tat: null, overdue: 100 },
  { name: "Vision India Pvt Limited.", volume: 2, sla: null, tat: null, overdue: 100 },
  { name: "Nikhil Tech", volume: 2, sla: 100, tat: 2.6, overdue: 50 },
  { name: "IRFC", volume: 1, sla: null, tat: null, overdue: 100 },
  { name: "Navneet Kirana", volume: 1, sla: null, tat: null, overdue: 100 },
];

// Branch values are derived from the client table (single branch in scope)
const BRANCHES = [{ name: "Head Office", volume: 11, sla: 100, tat: 2.6, overdue: 90.9 }];

const CHECKS = [
  { type: "Employment", volume: 11, discrepancy: 55.0, tat: 9.1, color: "#1f9d55" },
  { type: "Education", volume: 11, discrepancy: 55.0, tat: 8.7, color: "#2b7fd4" },
  { type: "Criminal", volume: 2, discrepancy: 50.0, tat: 0.6, color: "#7c4ddb" },
  { type: "Reference", volume: 2, discrepancy: 50.0, tat: 0.5, color: "#f08a24" },
];

const OWNERS = [{ name: "Unassigned", open: 10, overdue: 10, completed: 1 }];

const OUTLOOK = [
  { label: "Due next 7 days", value: 0, tone: "blue", icon: "calendar" },
  { label: "At risk next 7 days", value: 6, tone: "orange", icon: "alert" },
  { label: "Projected completions", value: 0, tone: "green", icon: "check" },
  { label: "Unassigned active", value: 10, tone: "violet", icon: "user" },
];

/* =====================================================================
   Icons
   ===================================================================== */

const IP = {
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  alert: <><path d="M10.3 4.2L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" /><path d="M12 9.5v4M12 17h.01" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  user: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  inbox: <><path d="M4 13l2.5-7h11L20 13v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" /><path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".8" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  down: <path d="M7 10l5 5 5-5" />,
  download: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
};
const I = ({ n, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {IP[n]}
  </svg>
);

/* =====================================================================
   Chart helpers
   ===================================================================== */

// Monotone cubic path: smooth, never overshoots below zero
function smoothPath(pts) {
  if (pts.length < 2) return "";
  const n = pts.length;
  const dx = [], dy = [], m = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    dy[i] = pts[i + 1][1] - pts[i][1];
    m[i] = dy[i] / dx[i];
  }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${pts[i][0] + h},${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

/* =====================================================================
   Sections
   ===================================================================== */

function Kpis({ daily, sla, tat }) {
  const intake = daily.reduce((s, d) => s + d.intake, 0);
  const done = daily.reduce((s, d) => s + d.completed, 0);
  const items = [
    { label: "Cases received", value: intake, hint: "In the selected window", icon: "inbox", cls: "is-brand" },
    { label: "Cases completed", value: done, hint: `${Math.round((done / Math.max(intake, 1)) * 100)}% of intake`, icon: "check", cls: "is-orange" },
    { label: "SLA attainment", value: `${sla.value}%`, hint: `${sla.measured} measured delivery`, icon: "target", cls: "is-teal" },
    { label: "Average turnaround", value: `${tat.value}${tat.unit}`, hint: "Intake to report delivery", icon: "clock", cls: "is-violet" },
  ];
  return (
    <div className="stat-cards">
      {items.map((k) => (
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
  );
}

function IntakeChart({ daily }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const W = 720, H = 260, L = 34, R = 12, T = 16, B = 30;
  const max = Math.max(2, ...daily.map((d) => Math.max(d.intake, d.completed)));
  const x = (i) => L + (i * (W - L - R)) / (daily.length - 1);
  const y = (v) => T + (1 - v / max) * (H - T - B);

  const intakePts = daily.map((d, i) => [x(i), y(d.intake)]);
  const donePts = daily.map((d, i) => [x(i), y(d.completed)]);
  const intakeLine = smoothPath(intakePts);
  const doneLine = smoothPath(donePts);
  const area = `${intakeLine} L${x(daily.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const ticks = [0, max / 2, max];

  const onMove = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (daily.length - 1));
    setHover(Math.max(0, Math.min(daily.length - 1, i)));
  };

  const totals = {
    intake: daily.reduce((s, d) => s + d.intake, 0),
    done: daily.reduce((s, d) => s + d.completed, 0),
  };

  return (
    <section className="card panel span-2" aria-labelledby="ea-ivc">
      <header className="panel-head">
        <div>
          <h2 id="ea-ivc">Intake vs completions</h2>
          <p>Cases received against cases completed, day by day.</p>
        </div>
        <ul className="chart-legend">
          <li><i className="is-brand" />Intake <strong>{totals.intake}</strong></li>
          <li><i className="is-orange" />Completed <strong>{totals.done}</strong></li>
        </ul>
      </header>

      <div className="chart">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`Intake ${totals.intake} and completions ${totals.done} over ${daily.length} days`}
        >
          <defs>
            <linearGradient id="ea-brand-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2fbf62" stopOpacity="0.28" />
              <stop offset="1" stopColor="#2fbf62" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ea-brand-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#54d27a" />
              <stop offset="0.6" stopColor="#1f9d55" />
              <stop offset="1" stopColor="#15653c" />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="chart-grid" />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" className="chart-axis">{Number.isInteger(t) ? t : t.toFixed(1)}</text>
            </g>
          ))}
          {daily.map((d, i) =>
            i % 4 === 0 ? (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="chart-axis">{d.label}</text>
            ) : null
          )}

          <path d={area} fill="url(#ea-brand-fill)" />
          <path d={intakeLine} className="chart-line" stroke="url(#ea-brand-line)" />
          <path d={doneLine} className="chart-line chart-line-orange" />

          {hover != null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={T} y2={y(0)} className="chart-cursor" />
              <circle cx={x(hover)} cy={y(daily[hover].intake)} r="4.5" className="chart-dot chart-dot-brand" />
              <circle cx={x(hover)} cy={y(daily[hover].completed)} r="4.5" className="chart-dot chart-dot-orange" />
            </g>
          )}
        </svg>

        {hover != null && (
          <div
            className="chart-tooltip"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > daily.length * 0.7 ? "-105%" : "8%"})` }}
          >
            <span className="chart-tooltip-date">{daily[hover].label}</span>
            <span><i className="is-brand" />Intake <strong>{daily[hover].intake}</strong></span>
            <span><i className="is-orange" />Completed <strong>{daily[hover].completed}</strong></span>
          </div>
        )}
      </div>
    </section>
  );
}

function OutcomeMix({ items }) {
  const total = items.reduce((s, x) => s + x.value, 0) || 1;
  const R = 52, C = 2 * Math.PI * R, gap = 3;
  let offset = 0;
  return (
    <section className="card panel" aria-labelledby="ea-om">
      <header className="panel-head">
        <div>
          <h2 id="ea-om">Outcome mix</h2>
          <p>Verification outcomes in this window.</p>
        </div>
      </header>
      <div className="analytics-donut">
        <svg viewBox="0 0 140 140" role="img" aria-label={items.map((i) => `${i.label} ${i.value}`).join(", ")}>
          <circle cx="70" cy="70" r={R} className="analytics-donut-bg" />
          {items.filter((i) => i.value).map((i) => {
            const len = (i.value / total) * C;
            const el = (
              <circle
                key={i.label}
                cx="70" cy="70" r={R}
                fill="none" stroke={i.color} strokeWidth="16" strokeLinecap="round"
                strokeDasharray={`${Math.max(len - gap, 0.1)} ${C}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="analytics-donut-center">
          <strong>{total}</strong>
          <span>outcomes</span>
        </div>
      </div>
      <ul className="analytics-outcomes">
        {items.map((i) => (
          <li key={i.label}>
            <i style={{ background: i.color }} />
            <span>{i.label}</span>
            <strong>{i.value}</strong>
            <em>{Math.round((i.value / total) * 100)}%</em>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SlaCard({ sla }) {
  const R = 60, arc = Math.PI * R;
  const pct = Math.min(sla.value, 100) / 100;
  return (
    <section className="card panel" aria-labelledby="ea-sla">
      <header className="panel-head">
        <div>
          <h2 id="ea-sla">SLA attainment</h2>
          <p>Share of cases delivered inside the client commitment.</p>
        </div>
      </header>
      <div className="analytics-gauge">
        <svg viewBox="0 0 150 86" role="img" aria-label={`SLA attainment ${sla.value}%`}>
          <defs>
            <linearGradient id="ea-teal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#5fd3c6" />
              <stop offset="1" stopColor="#0f8b8d" />
            </linearGradient>
          </defs>
          <path d="M15 78 A60 60 0 0 1 135 78" className="analytics-gauge-bg" />
          <path d="M15 78 A60 60 0 0 1 135 78" className="analytics-gauge-arc" strokeDasharray={`${pct * arc} ${arc}`} />
        </svg>
        <div className="analytics-gauge-value">
          <strong>{sla.value}%</strong>
          <span>{sla.target != null ? `Target ${sla.target}%` : "delivered on time"}</span>
        </div>
      </div>
      <p className="panel-note">Based on {sla.measured} measured delivery, last on {sla.lastPoint}.</p>
    </section>
  );
}

function TurnaroundCard({ tat }) {
  const pct = tat.target ? Math.min(tat.value / tat.target, 1) : null;
  return (
    <section className="card panel" aria-labelledby="analytics-turnaround">
      <header className="panel-head">
        <div>
          <h2 id="analytics-turnaround">Average turnaround</h2>
          <p>Mean hours from intake to report delivery.</p>
        </div>
      </header>
      <div className="analytics-turnaround">
        <strong>{tat.value}<small>{tat.unit}</small></strong>
        {pct != null && (
          <div className="analytics-turnaround-scale">
            <span className="analytics-turnaround-track"><span style={{ width: `${pct * 100}%` }} /></span>
            <span className="analytics-turnaround-labels"><em>0h</em><em>{tat.target}h target</em></span>
          </div>
        )}
        <dl className="analytics-turnaround-facts">
          <div><dt>Deliveries measured</dt><dd>{tat.measured}</dd></div>
          <div><dt>Last measured</dt><dd>{tat.lastPoint}</dd></div>
        </dl>
      </div>
      <p className="panel-note">Turnaround covers cases delivered inside the selected window.</p>
    </section>
  );
}

function Outlook({ items }) {
  return (
    <section className="card panel" aria-labelledby="ea-out">
      <header className="panel-head">
        <div>
          <h2 id="ea-out">Seven-day outlook</h2>
          <p>Due work, risk and projected completions.</p>
        </div>
      </header>
      <div className="analytics-outlook">
        {items.map((o) => (
          <div key={o.label} className={`analytics-tile is-${o.tone}`}>
            <span className="analytics-tile-icon"><I n={o.icon} s={15} /></span>
            <strong>{o.value}</strong>
            <span>{o.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const NA = () => <span className="not-available">Not available</span>;

function overdueTone(v) {
  return v >= 75 ? "is-red" : v >= 40 ? "is-amber" : "is-green";
}

function PerformanceTable({ id, title, subtitle, rows, nameLabel }) {
  const [sort, setSort] = useState({ key: "volume", dir: -1 });
  const maxVol = Math.max(...rows.map((r) => r.volume), 1);
  const sorted = useMemo(() => {
    const v = (r) => (r[sort.key] == null ? -1 : r[sort.key]);
    return [...rows].sort((a, b) =>
      sort.key === "name" ? a.name.localeCompare(b.name) * sort.dir * -1 : (v(a) - v(b)) * sort.dir
    );
  }, [rows, sort]);

  const Th = ({ k, children, num }) => (
    <th className={num ? "analytics-number" : ""} aria-sort={sort.key === k ? (sort.dir > 0 ? "ascending" : "descending") : "none"}>
      <button onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : -1 }))}>
        {children}
        <span className={`analytics-sort ${sort.key === k ? "is-on" : ""}`}>{sort.key === k && sort.dir > 0 ? "▲" : "▼"}</span>
      </button>
    </th>
  );

  return (
    <section className="card panel panel-table" aria-labelledby={id}>
      <header className="panel-head">
        <div>
          <h2 id={id}>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <Th k="name">{nameLabel}</Th>
              <Th k="volume">Volume</Th>
              <Th k="sla">SLA</Th>
              <Th k="tat" num>Avg TAT</Th>
              <Th k="overdue">Overdue</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.name}>
                <td>
                  <span className="analytics-client">
                    <span className="analytics-client-mark">{r.name.replace(/[^A-Za-z ]/g, "").split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                    {r.name}
                  </span>
                </td>
                <td>
                  <span className="analytics-volume">
                    <strong>{r.volume}</strong>
                    <span className="analytics-volume-bar"><span style={{ width: `${(r.volume / maxVol) * 100}%` }} /></span>
                  </span>
                </td>
                <td>{r.sla == null ? <NA /> : <span className="pill is-green">{r.sla.toFixed(1)}%</span>}</td>
                <td className="analytics-number">{r.tat == null ? <NA /> : `${r.tat}h`}</td>
                <td>
                  <span className={`analytics-overdue ${overdueTone(r.overdue)}`}>
                    <span className="analytics-overdue-track"><span style={{ width: `${r.overdue}%` }} /></span>
                    <strong>{r.overdue.toFixed(1)}%</strong>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CheckPerformance({ rows }) {
  const maxTat = Math.max(...rows.map((r) => r.tat), 1);
  return (
    <section className="card panel panel-table" aria-labelledby="ea-checks">
      <header className="panel-head">
        <div>
          <h2 id="ea-checks">Check performance</h2>
          <p>Turnaround and discrepancy rate by check type.</p>
        </div>
      </header>
      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Check type</th>
              <th className="analytics-number">Volume</th>
              <th>Discrepancy</th>
              <th>Avg TAT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.type}>
                <td>
                  <span className="analytics-client">
                    <i className="analytics-swatch" style={{ background: r.color }} />
                    {r.type}
                  </span>
                </td>
                <td className="analytics-number"><strong>{r.volume}</strong></td>
                <td><span className={`pill ${r.discrepancy >= 50 ? "is-red" : "is-amber"}`}>{r.discrepancy.toFixed(1)}%</span></td>
                <td>
                  <span className="analytics-volume">
                    <strong>{r.tat}h</strong>
                    <span className="analytics-volume-bar is-soft"><span style={{ width: `${(r.tat / maxTat) * 100}%`, background: r.color }} /></span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OwnerWorkload({ owners }) {
  return (
    <section className="card panel" aria-labelledby="ea-owner">
      <header className="panel-head">
        <div>
          <h2 id="ea-owner">Owner workload</h2>
          <p>Assigned open work, overdue pressure and completions in this window.</p>
        </div>
        <ul className="chart-legend">
          <li><i className="is-brand" />On time</li>
          <li><i className="is-red" />Overdue</li>
          <li><i className="is-orange" />Completed</li>
        </ul>
      </header>
      <ul className="analytics-owners">
        {owners.map((o) => {
          const total = o.open + o.completed || 1;
          const onTime = o.open - o.overdue;
          return (
            <li key={o.name}>
              <div className="analytics-owners-line">
                <span className="analytics-owners-name">
                  <span className="analytics-owners-avatar">{o.name === "Unassigned" ? "?" : o.name[0]}</span>
                  {o.name}
                </span>
                <span className="analytics-owners-meta">
                  <b>{o.open}</b> open <b className="analytics-red">{o.overdue}</b> overdue <b>{o.completed}</b> completed
                </span>
              </div>
              <span className="analytics-stack">
                {onTime > 0 && <span className="is-brand" style={{ flexGrow: onTime / total }} />}
                {o.overdue > 0 && <span className="is-red" style={{ flexGrow: o.overdue / total }} />}
                {o.completed > 0 && <span className="is-orange" style={{ flexGrow: o.completed / total }} />}
              </span>
            </li>
          );
        })}
      </ul>
      {owners.length === 1 && owners[0].name === "Unassigned" && (
        <div className="callout">
          <I n="alert" s={16} />
          <span>All open work is unassigned. Assigning owners will unlock per-verifier workload tracking here.</span>
        </div>
      )}
    </section>
  );
}

/* =====================================================================
   Page
   ===================================================================== */

export default function ExecutiveAnalytics({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  daily = DAILY,
  sla = SLA,
  turnaround = TURNAROUND,
  outcomes = OUTCOMES,
  clients = CLIENTS,
  branches = BRANCHES,
  checks = CHECKS,
  owners = OWNERS,
  outlook = OUTLOOK,
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onFilterChange = (f) => console.log("filters", f),
  onSearch = (q) => console.log("search", q),
  onExport = () => console.log("export"),
}) {
  const [menu, setMenu] = useState(false);
  const [client, setClient] = useState("all");
  const [range, setRange] = useState("30");

  const update = (next) => {
    const f = { client, range, ...next };
    setClient(f.client);
    setRange(f.range);
    onFilterChange(f);
  };

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />

      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page page-stack">
          <div className="page-hero">
            <div>
              <p className="hero-eyebrow">Command, Head Office</p>
              <h1>Executive analytics</h1>
              <p className="page-hero-subtitle">Delivery volume, quality and risk across your client portfolio.</p>
            </div>
            <div className="page-hero-actions">
              <label className="select-dropdown">
                <span className="visually-hidden">Client</span>
                <select value={client} onChange={(e) => update({ client: e.target.value })}>
                  <option value="all">All clients</option>
                  {clients.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <I n="down" />
              </label>
              <div className="range-toggle" role="group" aria-label="Time window">
                {[["7", "7D"], ["30", "30D"], ["90", "90D"], ["365", "12M"]].map(([v, l]) => (
                  <button key={v} aria-pressed={range === v} className={range === v ? "is-active" : ""} onClick={() => update({ range: v })}>{l}</button>
                ))}
              </div>
              <button className="export-button" onClick={onExport}><I n="download" /> Export</button>
            </div>
          </div>

          <Kpis daily={daily} sla={sla} tat={turnaround} />

          <div className="grid-3">
            <IntakeChart daily={daily} />
            <OutcomeMix items={outcomes} />
          </div>

          <div className="grid-3">
            <SlaCard sla={sla} />
            <TurnaroundCard tat={turnaround} />
            <Outlook items={outlook} />
          </div>

          <PerformanceTable id="ea-clients" title="Client performance" subtitle="Volume and delivery quality by client account." rows={clients} nameLabel="Client" />

          <div className="grid-2">
            <PerformanceTable id="ea-branches" title="Branch performance" subtitle="Delivery performance by operating location." rows={branches} nameLabel="Branch" />
            <CheckPerformance rows={checks} />
          </div>

          <OwnerWorkload owners={owners} />
        </main>
      </div>
    </div>
  );
}