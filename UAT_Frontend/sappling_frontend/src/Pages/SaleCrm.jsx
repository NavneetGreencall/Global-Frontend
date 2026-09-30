import { useRef, useState } from "react";
import { Header, Sidebar, SAPLING_LOGO } from "./ControlTower";
import "../Styles/ControlTower.css";
import "../Styles/ExecutiveAnalytics.css";
import "../Styles/SaleCrm.css";

/* =====================================================================
   Sample data taken from your current Sales & CRM page.
   Replace with API data or pass everything in as props.
   ===================================================================== */

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

const KPIS = [
  { id: "pipeline", label: "Open pipeline", value: 0, delta: 100, series: [0, 0, 0, 0, 0, 0], cls: "is-brand", format: "inr" },
  { id: "weighted", label: "Weighted forecast", value: 0, delta: 100, series: [0, 0, 0, 0, 0, 0], cls: "is-orange", format: "inr" },
  { id: "won", label: "Closed won", value: 503000, delta: 100, series: [0, 0, 0, 0, 0, 503000], cls: "is-teal", format: "inr" },
  { id: "winrate", label: "Win rate", value: 100, delta: 100, series: [0, 0, 0, 0, 0, 100], cls: "is-violet", format: "pct" },
];

const FOLLOWUPS = [
  { id: "pending", label: "Pending follow-ups", value: 0, tone: "green", icon: "clock", href: "/admin/sales/follow-ups" },
  { id: "overdue", label: "Overdue follow-ups", value: 0, tone: "red", icon: "alert", href: "/admin/sales/follow-ups?filter=overdue" },
  { id: "unassigned", label: "Unassigned opportunities", value: 0, tone: "teal", icon: "user", href: "/admin/sales/opportunities?filter=unassigned" },
];

// Monthly values for the revenue trend tabs
const TREND = {
  pipeline: [0, 0, 0, 0, 0, 503000],
  weighted: [0, 0, 0, 0, 0, 0],
  won: [0, 0, 0, 0, 0, 503000],
};

/* =====================================================================
   Helpers
   ===================================================================== */

const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

// Indian compact format: ₹5.03L, ₹1.2Cr
const inrShort = (n) => {
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹${+(n / 1e3).toFixed(1)}K`;
  return `₹${n}`;
};

const fmt = (v, f) => (f === "pct" ? `${v.toFixed(1)}%` : inr(v));

function smoothPath(pts) {
  if (pts.length < 2) return "";
  const n = pts.length, dx = [], m = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
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
   Icons
   ===================================================================== */

const IP = {
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  alert: <><path d="M10.3 4.2L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" /><path d="M12 9.5v4M12 17h.01" /></>,
  user: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  up: <path d="M7 17L17 7M9 7h8v8" />,
  down: <path d="M7 7l10 10M17 9v8H9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  ext: <><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 14v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18V7.5A1.5 1.5 0 0 1 5.5 6H10" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".8" /></>,
  rupee: <path d="M7 5h10M7 9h10M7 5c5 0 7 1.5 7 4s-2 4-7 4l7 6" />,
  funnel: <path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" />,
};
const I = ({ n, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {IP[n]}
  </svg>
);

/* =====================================================================
   Sections
   ===================================================================== */

function Spark({ series }) {
  const W = 92, H = 30;
  const max = Math.max(...series, 1);
  const pts = series.map((v, i) => [2 + (i * (W - 4)) / (series.length - 1), H - 3 - (v / max) * (H - 8)]);
  const d = smoothPath(pts);
  const last = pts[pts.length - 1];
  return (
    <svg className="sales-spark" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={`${d} L${last[0]},${H} L2,${H} Z`} className="sales-spark-fill" />
      <path d={d} className="sales-spark-line" />
      <circle cx={last[0]} cy={last[1]} r="2.6" className="sales-spark-dot" />
    </svg>
  );
}

function Kpis({ items }) {
  return (
    <div className="stat-cards">
      {items.map((k) => (
        <div key={k.id} className={`stat-card sales-kpi ${k.cls}`}>
          <div className="stat-card-top">
            <span>{k.label}</span>
          </div>
          <strong>{fmt(k.value, k.format)}</strong>
          <div className="sales-kpi-footer">
            <span className="sales-delta">
              <I n={k.delta >= 0 ? "up" : "down"} s={12} />
              {Math.abs(k.delta).toFixed(1)}%
            </span>
            <Spark series={k.series} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FollowUps({ items }) {
  return (
    <div className="sales-follow">
      {items.map((f) => (
        <a key={f.id} href={f.href} className={`card sales-follow-card is-${f.tone}`}>
          <span className="sales-follow-icon"><I n={f.icon} /></span>
          <span className="sales-follow-label">{f.label}</span>
          <strong>{f.value}</strong>
          <span className="sales-follow-go"><I n="arrow" s={14} /></span>
        </a>
      ))}
    </div>
  );
}

function RevenueTrend({ trend, months }) {
  const [tab, setTab] = useState("pipeline");
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  const tabs = [
    ["pipeline", "Pipeline", "#22a65a"],
    ["weighted", "Weighted", "#f08a24"],
    ["won", "Closed won", "#17a2a0"],
  ];
  const color = tabs.find((t) => t[0] === tab)[2];
  const series = trend[tab];
  const current = series[series.length - 1];
  const prev = series[series.length - 2];
  const change = prev ? ((current - prev) / prev) * 100 : null;

  const W = 760, H = 250, L = 52, R = 14, T = 18, B = 30;
  const max = Math.max(...series, 1);
  const niceMax = max <= 1 ? 1 : max * 1.1;
  const x = (i) => L + (i * (W - L - R)) / (series.length - 1);
  const y = (v) => T + (1 - v / niceMax) * (H - T - B);
  const pts = series.map((v, i) => [x(i), y(v)]);
  const line = smoothPath(pts);
  const area = `${line} L${x(series.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const ticks = [0, niceMax / 2, niceMax];

  const onMove = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  };

  return (
    <section className="card panel span-2" aria-labelledby="sales-trend">
      <header className="panel-head">
        <div>
          <h2 id="sales-trend">Revenue trend</h2>
          <p>Monthly value across the last {months.length} months.</p>
        </div>
        <a className="more-link" href="/admin/sales/forecast">Forecast <I n="ext" s={14} /></a>
      </header>

      <div className="sales-trend-bar">
        <div className="sales-tabs" role="tablist" aria-label="Revenue series">
          {tabs.map(([k, label, c]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "is-active" : ""} style={{ "--c": c }} onClick={() => { setTab(k); setHover(null); }}>
              <i />{label}
            </button>
          ))}
        </div>
        <div className="sales-trend-value">
          <strong>{inrShort(current)}</strong>
          <span className={`sales-change ${change == null ? "is-new" : change >= 0 ? "is-up" : "is-down"}`}>
            {change == null ? (current > 0 ? `New in ${months[months.length - 1]}` : `No change vs ${months[months.length - 2]}`) : `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs ${months[months.length - 2]}`}
          </span>
        </div>
      </div>

      <div className="chart">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`${tabs.find((t) => t[0] === tab)[1]} by month: ${months.map((m, i) => `${m} ${inrShort(series[i])}`).join(", ")}`}
        >
          <defs>
            <linearGradient id="sc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.26" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="chart-grid" />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" className="chart-axis">{inrShort(Math.round(t))}</text>
            </g>
          ))}
          {months.map((m, i) => (
            <text key={m} x={x(i)} y={H - 8} textAnchor="middle" className="chart-axis">{m}</text>
          ))}
          <path key={`a-${tab}`} d={area} fill="url(#sc-fill)" className="sales-area" />
          <path key={`l-${tab}`} d={line} className="chart-line sales-line" stroke={color} />
          {pts.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 5 : 3} fill="#fff" stroke={color} strokeWidth="2" />
          ))}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={y(0)} className="chart-cursor" />}
        </svg>
        {hover != null && (
          <div className="chart-tooltip" style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover >= series.length - 2 ? "-108%" : "10%"})` }}>
            <span className="chart-tooltip-date">{months[hover]} 2026</span>
            <span><i style={{ background: color }} />{tabs.find((t) => t[0] === tab)[1]} <strong>{inr(series[hover])}</strong></span>
          </div>
        )}
      </div>
    </section>
  );
}

function PipelineHealth({ kpis }) {
  const get = (id) => kpis.find((k) => k.id === id)?.value ?? 0;
  const win = get("winrate"), won = get("won"), open = get("pipeline"), weighted = get("weighted");
  const R = 50, C = 2 * Math.PI * R;
  return (
    <section className="card panel sales-health" aria-labelledby="sales-health">
      <header className="panel-head">
        <div>
          <h2 id="sales-health">Pipeline health</h2>
          <p>Win rate and what's left to close.</p>
        </div>
      </header>

      <div className="sales-ring">
        <svg viewBox="0 0 130 130" role="img" aria-label={`Win rate ${win}%`}>
          <defs>
            <linearGradient id="sc-ring-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#5ad37f" />
              <stop offset="0.5" stopColor="#22a65a" />
              <stop offset="1" stopColor="#15653c" />
            </linearGradient>
          </defs>
          <circle cx="65" cy="65" r={R} className="sales-ring-bg" />
          <circle cx="65" cy="65" r={R} className="sales-ring-value" strokeDasharray={`${(win / 100) * C} ${C}`} transform="rotate(-90 65 65)" />
        </svg>
        <div className="sales-ring-center">
          <strong>{win.toFixed(0)}%</strong>
          <span>win rate</span>
        </div>
      </div>

      <dl className="sales-facts">
        <div className="is-teal"><dt><I n="rupee" s={13} />Closed won</dt><dd>{inrShort(won)}</dd></div>
        <div className="is-green"><dt><I n="funnel" s={13} />Open pipeline</dt><dd>{inrShort(open)}</dd></div>
        <div className="is-orange"><dt><I n="target" s={13} />Weighted</dt><dd>{inrShort(weighted)}</dd></div>
      </dl>

      {open === 0 && (
        <div className="callout">
          <I n="alert" s={16} />
          <span>The open pipeline is empty. Add opportunities to build next quarter's forecast.</span>
        </div>
      )}
    </section>
  );
}

/* =====================================================================
   Page
   ===================================================================== */

export default function SalesCRM({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  kpis = KPIS,
  followUps = FOLLOWUPS,
  trend = TREND,
  months = MONTHS,
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onNewOpportunity = () => console.log("new opportunity"),
  onRangeChange = (r) => console.log("range", r),
  onSearch = (q) => console.log("search", q),
}) {
  const [menu, setMenu] = useState(false);
  const [range, setRange] = useState("6m");

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page page-stack">
          <div className="page-hero">
            <div>
              <p className="hero-eyebrow">Command, Head Office</p>
              <h1>Sales &amp; CRM</h1>
              <p className="page-hero-subtitle">Pipeline, forecast and closed revenue across your client accounts.</p>
            </div>
            <div className="page-hero-actions">
              <div className="range-toggle" role="group" aria-label="Time window">
                {[["3m", "3M"], ["6m", "6M"], ["12m", "12M"]].map(([v, l]) => (
                  <button key={v} aria-pressed={range === v} className={range === v ? "is-active" : ""} onClick={() => { setRange(v); onRangeChange(v); }}>{l}</button>
                ))}
              </div>
              <button className="button-primary sales-new" onClick={onNewOpportunity}><I n="plus" s={15} /> New opportunity</button>
            </div>
          </div>

          <Kpis items={kpis} />
          <FollowUps items={followUps} />

          <div className="grid-3">
            <RevenueTrend trend={trend} months={months} />
            <PipelineHealth kpis={kpis} />
          </div>
        </main>
      </div>
    </div>
  );
}