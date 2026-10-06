import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Header, Sidebar, SAPLING_LOGO } from "@/layout";
import { SAMPLE_USER } from "@/sample-data/user";
import { STATS, VISITS } from "@/sample-data/field-operations";
import { Pagination } from "@/components/ui";
import type { ShellProps } from "@/layout";
import "./field-operations.css";

/* =====================================================================
   Data from your current Field Operations page.
   Pass real data with <FieldOperations visits={...} stats={...} />.

   distanceM: GPS distance from the target address (null = no reading yet)
   allowedM:  geofence radius allowed for the visit
   ===================================================================== */

/* ---------- data types ---------- */

export type VisitStatus = "scheduled" | "checked_in" | "evidence_pending" | "completed" | "outside";
type GeoState = "inside" | "outside" | "unknown";

/** null = not provided by the API (shows "—") */
export interface FieldStats {
  activityToday: number | null;
  evidencePending: number | null;
  outsideGeofence: number;
  reviewEvidence: number | null;
  reviewExceptions: number;
}

/** distanceM: GPS distance from the target (null = no reading yet). allowedM: geofence radius. */
export interface FieldVisit {
  id: string;
  caseId: string;
  candidate: string;
  client: string;
  status: VisitStatus;
  executive: string;
  location: string;
  distanceM: number | null;
  allowedM: number;
  recorded: string; // ISO date-time
}

const STATUS: Record<VisitStatus, { label: string; tone: string }> = {
  scheduled: { label: "Scheduled", tone: "slate" },
  checked_in: { label: "Checked in", tone: "blue" },
  evidence_pending: { label: "Evidence pending", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
  outside: { label: "Outside geofence", tone: "red" },
};

const PAGE_SIZE = 10;

/* =====================================================================
   Helpers + icons
   ===================================================================== */

const fmtRecorded = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST";

const fmtM = (m: number) => (m >= 1000 ? `${+(m / 1000).toFixed(1)} km` : `${m} m`);

// inside | outside | unknown
const geoState = (v: FieldVisit): GeoState => (v.distanceM == null ? "unknown" : v.distanceM <= v.allowedM ? "inside" : "outside");

const IP: Record<string, ReactNode> = {
  send: <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  pin: <><path d="M12 20.5s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z" /><circle cx="12" cy="9.5" r="2.2" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5M12 16h.01" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  down: <path d="M7 10l5 5 5-5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  user: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".8" /></>,
};
const I = ({ n, s = 16 }: { n: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {IP[n]}
  </svg>
);

/* =====================================================================
   Visit row
   ===================================================================== */

function Geofence({ v }: { v: FieldVisit }) {
  const g = geoState(v);
  if (g === "unknown") {
    return (
      <span className="field-geofence is-unknown">
        <I n="target" s={12} />{fmtM(v.allowedM)} allowed radius, no GPS reading yet
      </span>
    );
  }
  const distance = v.distanceM ?? 0; // known here: "unknown" returned above
  const pct = Math.min(100, Math.round((distance / v.allowedM) * 100));
  return (
    <span className={`field-geofence is-${g}`}>
      <span className="field-geofence-text">
        <I n={g === "inside" ? "check" : "alert"} s={12} />
        {fmtM(distance)} from target, {fmtM(v.allowedM)} allowed
      </span>
      <span className="field-geofence-track" aria-hidden="true"><span style={{ width: `${Math.max(pct, 3)}%` }} /></span>
    </span>
  );
}

function VisitRow({ v }: { v: FieldVisit }) {
  const st = STATUS[v.status] ?? STATUS.scheduled;
  return (
    <li className={`list-row field-row is-${st.tone}`}>
      <div className="row-person">
        <span className="field-avatar">{v.candidate[0].toUpperCase()}</span>
        <div className="row-person-text">
          <div className="row-title-line">
            <Link to={`/admin/cases/${v.caseId}`} className="row-name">{v.candidate}</Link>
            <span className={`field-status is-${st.tone}`}><i />{st.label}</span>
          </div>
          <span className="row-meta"><span className="row-id">{v.caseId}</span> · {v.client}</span>
        </div>
      </div>

      <div className="row-cell">
        <span className="row-label">Field executive</span>
        <span className="field-executive"><span className="field-executive-icon"><I n="user" s={12} /></span>{v.executive}</span>
      </div>

      <div className="row-cell">
        <span className="row-label">Visit location</span>
        <span className="field-location"><I n="pin" s={13} />{v.location}</span>
        <Geofence v={v} />
      </div>

      <div className="row-cell">
        <span className="row-label">Recorded</span>
        <span className="row-value">{fmtRecorded(v.recorded)}</span>
      </div>

      <div className="row-actions">
        <Link to={`/admin/cases/${v.caseId}`} className="row-open" aria-label={`Open case ${v.caseId}`}><I n="arrow" s={15} /></Link>
      </div>
    </li>
  );
}

/* =====================================================================
   Page
   ===================================================================== */

interface FieldOperationsProps extends ShellProps {
  stats?: FieldStats;
  visits?: FieldVisit[];
}

export default function FieldOperations({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  stats = STATS,
  visits = VISITS,
  user = SAMPLE_USER,
  onSearch = (q: string) => console.log("search", q),
}: FieldOperationsProps) {
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [geo, setGeo] = useState("all");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const c: Partial<Record<VisitStatus, number>> = {};
    visits.forEach((v) => (c[v.status] = (c[v.status] ?? 0) + 1));
    return c;
  }, [visits]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return visits
      .filter((v) => status === "all" || v.status === status)
      .filter((v) => geo === "all" || geoState(v) === geo)
      .filter((v) => !s || [v.candidate, v.caseId, v.client, v.executive, v.location].some((x) => x.toLowerCase().includes(s)))
      .sort((a, b) => new Date(b.recorded).getTime() - new Date(a.recorded).getTime());
  }, [visits, q, status, geo]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const kpis = [
    { label: "Activity today", value: stats.activityToday ?? "—", hint: "Visits with activity today", icon: "send", cls: "is-leaf" },
    { label: "Evidence pending", value: stats.evidencePending ?? "—", hint: "Visits awaiting proof", icon: "camera", cls: "is-leaf" },
    { label: "Outside geofence", value: stats.outsideGeofence, hint: "GPS distance requires review", icon: "pin", cls: `is-leaf ${stats.outsideGeofence ? "is-alert" : ""}` },
    { label: "Review decisions", value: (stats.reviewEvidence ?? 0) + stats.reviewExceptions, hint: `${stats.reviewEvidence ?? "—"} evidence, ${stats.reviewExceptions} exceptions`, icon: "alert", cls: "is-leaf" },
  ];

  // [status, label, count, colour]
  const tabs: [VisitStatus | "all", string, number, string][] = [
    ["all", "All", visits.length, "slate"],
    ...(Object.entries(STATUS) as [VisitStatus, { label: string; tone: string }][]).map(
      ([k, v]): [VisitStatus, string, number, string] => [k, v.label, counts[k] ?? 0, v.tone]
    ),
  ];

  const reset = () => { setQ(""); setStatus("all"); setGeo("all"); setPage(1); };

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page page-stack">
          <div className="page-hero">
            <div>
              <p className="hero-eyebrow">Delivery, Head Office</p>
              <h1>Field operations oversight</h1>
              <p className="page-hero-subtitle">Address visits, evidence and geofence checks from the field team.</p>
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

          <section className="card list-card" aria-labelledby="fo-title">
            <header className="list-header">
              <div className="list-title">
                <h2 id="fo-title">Field attention queue <span className="count-pill">{list.length}</span></h2>
                <p>Visits surfaced by live field exception and geofence records.</p>
              </div>
              <div className="list-tools">
                <label className="search-field list-search">
                  <span className="visually-hidden">Search visits</span>
                  <I n="search" />
                  <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search visit or executive" />
                </label>
                <span className="select-field">
                  <label htmlFor="field-geofence" className="visually-hidden">Geofence</label>
                  <select id="field-geofence" value={geo} onChange={(e) => { setGeo(e.target.value); setPage(1); }}>
                    <option value="all">Any geofence result</option>
                    <option value="inside">Inside geofence</option>
                    <option value="outside">Outside geofence</option>
                    <option value="unknown">No GPS reading yet</option>
                  </select>
                  <I n="down" />
                </span>
              </div>
            </header>

            <div className="filter-tabs field-tabs" role="tablist" aria-label="Visit status">
              {tabs.map(([k, label, n, tone]) => (
                <button key={k} role="tab" aria-selected={status === k} className={`is-${tone} ${status === k ? "is-active" : ""}`} onClick={() => { setStatus(k); setPage(1); }}>
                  {k !== "all" && <i />}{label}<span>{n}</span>
                </button>
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="list-empty">
                <span className="list-empty-icon"><I n="pin" s={22} /></span>
                <strong>No visits match</strong>
                <span>Try another status or geofence filter, or clear the search.</span>
                <button className="button" onClick={reset}>Clear filters</button>
              </div>
            ) : (
              <ul className="row-list">
                {rows.map((v) => <VisitRow key={v.id} v={v} />)}
              </ul>
            )}

            <Pagination page={current} pageCount={pages} total={list.length} pageSize={PAGE_SIZE} onPageChange={setPage} itemLabel="visits" />
          </section>
        </main>
      </div>
    </div>
  );
}
