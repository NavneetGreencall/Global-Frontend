import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Icon, Sidebar, SAPLING_LOGO } from "@/layout";
import { SAMPLE_USER } from "@/sample-data/user";
import { STAGES, QUEUE, SIGNALS, REVENUE, RESULTS, INTAKE } from "@/sample-data/control-tower";
import { Pagination, usePagination } from "@/components/ui";
import type { ShellProps } from "@/layout";

export interface Stage {
  id: string;
  name: string;
  count: number;
  state: "moving" | "waiting" | "closed" | "clear";
  oldestHours: number;
  atRisk: number;
}

export interface QueueItem {
  id: string;
  candidate: string;
  stageId: string;
  client: string;
  waitingHours: number;
  due: string;
  critical: boolean;
  note: string;
  owner: string | null;
}

export interface Signal {
  id: string;
  label: string;
  value: number;
  href: string;
  icon: string;
  tone: string;
}

export interface Revenue {
  received: number;
  rows: { label: string; value: number; tone: string }[];
}

export interface Results {
  total: number;
  pending: number;
  clear: number;
}

export interface MonthValue {
  month: string;
  value: number;
}

type AssignMode = "me" | "choose";

/* =====================================================================
   Sample data. Replace with your API data or pass it in as props.
   ===================================================================== */

/* =====================================================================
   Helpers
   ===================================================================== */

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const age = (h: number) => {
  if (!h) return "—";
  const d = Math.floor(h / 24);
  const r = h % 24;
  return d ? `${d}d ${r}h` : `${r}h`;
};

/* =====================================================================
   Page sections
   ===================================================================== */

function Overview({ stages, sla, avgCompletion }: { stages: Stage[]; sla: number | null; avgCompletion: string }) {
  const active = stages.filter((x) => x.state !== "closed").reduce((s, x) => s + x.count, 0);
  const risk = stages.reduce((s, x) => s + x.atRisk, 0);
  const figures = [
    { label: "Active cases", value: active, hint: "All clients and branches", icon: "list", tone: "green", href: "/admin/cases" },
    { label: "At risk", value: risk, hint: `Across ${stages.filter((s) => s.atRisk).length} stages`, icon: "alert", tone: "amber", href: "/admin/cases?view=risk" },
    { label: "Average completion", value: avgCompletion, hint: "12-month cohort", icon: "clock", tone: "blue", href: "/admin/analytics" },
    { label: "SLA health", value: sla == null ? "—" : `${sla}%`, hint: "12-month cohort", icon: "shield", tone: "green", href: "/admin/analytics" },
  ];
  return (
    <div className="tower-figures">
      {figures.map((f) => (
        <Link key={f.label} to={f.href} className={`card tower-figure is-link is-${f.tone}`} aria-label={`${f.label}: ${f.value}. Open the list`}>
          <div className="tower-figure-top">
            <span className="tower-figure-label">{f.label}</span>
            <span className={`icon-badge is-${f.tone}`}><Icon n={f.icon} s={16} /></span>
          </div>
          <span className={`tower-figure-value ${f.tone === "amber" ? "is-warn" : ""}`}>{f.value}</span>
          <span className="tower-figure-hint">{f.hint}</span>
        </Link>
      ))}
    </div>
  );
}

function Pipeline({ stages, selected, onSelect }: { stages: Stage[]; selected: string | null; onSelect: (id: string | null) => void }) {
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

function AssignButton({ onPick }: { onPick: (mode: AssignMode) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
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
          <button role="menuitem" onClick={() => { onPick("choose"); setOpen(false); }}>Choose an owner…</button>
        </div>
      )}
    </div>
  );
}

interface QueueProps {
  rows: QueueItem[];
  stages: Stage[];
  stageFilter: string | null;
  onClearStage: () => void;
  onAssign: (id: string, mode: AssignMode) => void;
}

function Queue({ rows, stages, stageFilter, onClearStage, onAssign }: QueueProps) {
  const [tab, setTab] = useState<"all" | "critical" | "unassigned">("all");
  const stageName = (id: string) => stages.find((s) => s.id === id)?.name ?? id;

  const list = rows.filter((r) => {
    if (stageFilter && r.stageId !== stageFilter) return false;
    if (tab === "critical") return r.critical;
    if (tab === "unassigned") return !r.owner;
    return true;
  });
  const paged = usePagination(list, 8, [tab, stageFilter]);

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
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "is-active" : ""} onClick={() => setTab(k as typeof tab)}>
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
            {paged.items.map((r) => (
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
      <Pagination {...paged.props} itemLabel="cases" />
    </section>
  );
}

function Signals({ items }: { items: Signal[] }) {
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

function RevenuePanel({ data }: { data: Revenue }) {
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

function ResultsPanel({ data }: { data: Results }) {
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

function Intake({ data }: { data: MonthValue[] }) {
  const [range, setRange] = useState<number>(6);
  const pts = data.slice(-range);
  const max = Math.max(...pts.map((p) => p.value), 1);
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];

  const W = 320, H = 110, pad = 6;
  const x = (i: number) => pad + (i * (W - pad * 2)) / Math.max(pts.length - 1, 1);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
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

interface ControlTowerProps extends ShellProps {
  stages?: Stage[];
  queue?: QueueItem[];
  signals?: Signal[];
  revenue?: Revenue;
  results?: Results;
  intake?: MonthValue[];
  /** SLA %, or null when there is no delivery history yet (shows "—") */
  sla?: number | null;
  avgCompletion?: string;
  onAssign?: (caseId: string, mode: AssignMode) => void;
  onRegister?: () => void;
}

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
  user = SAMPLE_USER,
  onAssign = (id: string, mode: AssignMode) => console.log("assign", id, mode),
  onSearch = (q: string) => console.log("search", q),
  onRegister = () => console.log("register case"),
}: ControlTowerProps) {
  const [menu, setMenu] = useState(false);
  const [stageFilter, setStageFilter] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...queue].sort((a, b) => Number(b.critical) - Number(a.critical) || b.waitingHours - a.waitingHours),
    [queue]
  );

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const selectStage = (id: string | null) => {
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
            <RevenuePanel data={revenue} />
            <ResultsPanel data={results} />
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
