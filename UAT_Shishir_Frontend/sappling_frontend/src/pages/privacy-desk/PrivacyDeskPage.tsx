import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Header, Sidebar, SAPLING_LOGO } from "@/layout";
import { SAMPLE_USER } from "@/sample-data/user";
import { Pagination, usePagination } from "@/components/ui";
import type { ShellProps } from "@/layout";
import "./privacy-desk.css";
import RecordPrivacyDialog from "./RecordPrivacyDialog";
import type { PrivacyFormValues } from "./RecordPrivacyDialog";

/* =====================================================================
   Privacy desk

   Two workspaces: data subject requests and privacy incidents.
   Both lists are empty on your live page, so the defaults are [].
   SAMPLE_REQUESTS and SAMPLE_INCIDENTS below show the fields each
   record needs. Pass real data with:
     <PrivacyDesk requests={...} incidents={...} onRecord={...} />

   Only short references are stored here, never original documents.
   ===================================================================== */

/* ---------- data types ---------- */

export type Workspace = "requests" | "incidents";

/** One request or incident. dueAt is null when there is no deadline. */
export interface PrivacyRecord {
  id: string;
  title: string;
  subjectRef: string;
  type: string;
  status: string;
  receivedAt: string; // ISO date-time
  dueAt: string | null;
  /** context for the reviewer (sent when recording) */
  description?: string;
}

interface WorkspaceConfig {
  label: string;
  text: string;
  icon: string;
  button: string;
  types: Record<string, string>;
  statuses: Record<string, string>;
  open: string[]; // statuses that count as "open"
}


const WORKSPACES: Record<Workspace, WorkspaceConfig> = {
  requests: {
    label: "Data subject requests",
    text: "Access, corrections and erasure review",
    icon: "file",
    button: "Record request",
    types: { access: "Access", correction: "Correction", erasure: "Erasure" },
    statuses: { received: "Received", in_review: "In review", approved: "Approved", rejected: "Rejected", fulfilled: "Fulfilled" },
    open: ["received", "in_review", "approved"],
  },
  incidents: {
    label: "Privacy incidents",
    text: "Investigation, containment and closure",
    icon: "shield",
    button: "Record incident",
    types: { misdirected: "Misdirected data", unauthorised: "Unauthorised access", loss: "Data loss", other: "Other" },
    statuses: { open: "Open", investigating: "Investigating", contained: "Contained", closed: "Closed" },
    open: ["open", "investigating", "contained"],
  },
};

/** one shared empty list, so "no records" doesn't look like new data on every render */
const NO_RECORDS: PrivacyRecord[] = [];


/* ---------- helpers ---------- */

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

const istDay = (d: string | number) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const daysUntil = (iso: string) => Math.round((new Date(istDay(iso)).getTime() - new Date(istDay(Date.now())).getTime()) / 86400000);

/* ---------- icons ---------- */

const ICONS: Record<string, ReactNode> = {
  file: <><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" /><path d="M14 3.5V8h4.5" /><path d="M9 13h6M9 16.5h4" /></>,
  shield: <><path d="M12 3.5l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z" /><path d="M12 9v4M12 16h.01" /></>,
  info: <><path d="M12 3.5l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z" /><path d="M12 11v4.5M12 8h.01" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  building: <><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M10 20.5v-4h4v4" /></>,
  inbox: <><path d="M4 13l2.5-7h11L20 13v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" /><path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  down: <path d="M7 10l5 5 5-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

const Icon = ({ name, size = 16 }: { name: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- page ---------- */

interface PrivacyDeskProps extends ShellProps {
  requests?: PrivacyRecord[];
  incidents?: PrivacyRecord[];
  onRecord?: (workspace: Workspace, record: PrivacyRecord) => void | Promise<void>;
}

export default function PrivacyDesk({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  requests: initialRequests = NO_RECORDS,
  incidents: initialIncidents = NO_RECORDS,
  user = SAMPLE_USER,
  onRecord = (workspace: Workspace, record: PrivacyRecord) => console.log("record", workspace, record),
  onSearch = (q: string) => console.log("search", q),
}: PrivacyDeskProps) {
  const [menu, setMenu] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace>("requests");
  const [records, setRecords] = useState<Record<Workspace, PrivacyRecord[]>>({ requests: initialRequests, incidents: initialIncidents });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [recording, setRecording] = useState(false);

  // When fresh records arrive from the API, show them
  useEffect(() => setRecords({ requests: initialRequests, incidents: initialIncidents }), [initialRequests, initialIncidents]);

  const ws = WORKSPACES[workspace];
  const list = records[workspace];

  const switchTo = (w: Workspace) => { setWorkspace(w); setStatus("all"); setQuery(""); setRecording(false); };

  const summary = [
    { icon: "inbox", label: "Open requests", value: records.requests.filter((r) => WORKSPACES.requests.open.includes(r.status)).length, note: "Received or in review" },
    { icon: "clock", label: "Due within 7 days", value: records.requests.filter((r) => WORKSPACES.requests.open.includes(r.status) && r.dueAt && daysUntil(r.dueAt) <= 7).length, note: "Requests close to their deadline", alert: true },
    { icon: "shield", label: "Open incidents", value: records.incidents.filter((r) => WORKSPACES.incidents.open.includes(r.status)).length, note: "Investigating or contained", alert: true },
    { icon: "check", label: "Closed", value: [...records.requests, ...records.incidents].filter((r) => r.status === "closed").length, note: "Requests and incidents" },
  ];

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((r) => status === "all" || r.status === status)
      .filter((r) => !q || [r.title, r.subjectRef, r.id].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }, [list, query, status]);

  const paged = usePagination(shown, 10, [workspace, query, status]);

  const saveRecord = async (form: PrivacyFormValues) => {
    const now = new Date();
    const record: PrivacyRecord = {
      id: `${workspace === "requests" ? "DSR" : "PI"}-${String(list.length + 1).padStart(4, "0")}`,
      title: form.title,
      subjectRef: form.subjectRef || "—",
      type: form.type,
      description: form.description,
      status: workspace === "requests" ? "received" : "investigating",
      receivedAt: now.toISOString(),
      // requests are due 30 days after they are received
      // the chosen review date, else requests are due 30 days after they are received
      dueAt: form.dueDate ? new Date(`${form.dueDate}T18:00:00+05:30`).toISOString() : workspace === "requests" ? new Date(now.getTime() + 30 * 86400000).toISOString() : null,
    };
    // Show it straight away; in live mode the fresh list from the API then replaces it
    setRecords((all) => ({ ...all, [workspace]: [record, ...all[workspace]] }));
    await onRecord(workspace, record); // if this fails, the dialog stays open and shows why
  };

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page privacy-page">
          {/* Page header */}
          <header className="page-header privacy-header">
            <div>
              <p className="page-eyebrow">Platform</p>
              <h1 className="page-title">Privacy desk</h1>
              <p className="page-subtitle">Track data subject requests and privacy incidents from receipt to closure.</p>
            </div>
            <button className="record-button" onClick={() => setRecording(true)}>
              <Icon name="plus" size={15} /> {ws.button}
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

          {/* Workspace switch */}
          <div className="privacy-switch" role="tablist" aria-label="Privacy workspace">
            {(Object.entries(WORKSPACES) as [Workspace, WorkspaceConfig][]).map(([k, w]) => (
              <button
                key={k}
                role="tab"
                aria-selected={workspace === k}
                className={`privacy-switch-option ${workspace === k ? "is-active" : ""}`}
                onClick={() => switchTo(k)}
              >
                <span className="privacy-switch-icon"><Icon name={w.icon} size={18} /></span>
                <span>
                  <span className="privacy-switch-title">{w.label}</span>
                  <span className="privacy-switch-text">{w.text}</span>
                </span>
                <span className="privacy-switch-count">{records[k].filter((r) => w.open.includes(r.status)).length} open</span>
              </button>
            ))}
          </div>

          {/* Notice */}
          <p className="privacy-notice">
            <Icon name="info" size={16} />
            <span>
              Human review and decision tracking only. Nothing is deleted, withdrawn or reported to a regulator automatically from here.
              Keep original documents in your approved secure repository; only short references belong here.
            </span>
          </p>

          {/* Tools */}
          <div className="privacy-tools">
            <div className="privacy-tool">
              <span className="privacy-tool-icon"><Icon name="lock" size={18} /></span>
              <div className="privacy-tool-body">
                <span className="privacy-tool-title">Retention preview &amp; holds</span>
                <span className="privacy-tool-text">Review case age and preserve records. Automatic case deletion is disabled.</span>
              </div>
              <Link to="/admin/privacy/retention" className="privacy-tool-button">Open preview <Icon name="arrow" size={13} /></Link>
            </div>
            <div className="privacy-tool">
              <span className="privacy-tool-icon"><Icon name="building" size={18} /></span>
              <div className="privacy-tool-body">
                <span className="privacy-tool-title">Vendor data-sharing register</span>
                <span className="privacy-tool-text">Recipient, scope, authority, expiry and independent decisions.</span>
              </div>
              <Link to="/admin/privacy/vendors" className="privacy-tool-button">Open register <Icon name="arrow" size={13} /></Link>
            </div>
          </div>

          {/* New record form */}
          {recording && <RecordPrivacyDialog key={workspace} kind={workspace} onSubmit={saveRecord} onClose={() => setRecording(false)} />}

          {/* Records */}
          <section className="privacy-card" aria-label={ws.label}>
            <div className="privacy-toolbar">
              <label className="search-box">
                <span className="visually-hidden">Search records</span>
                <Icon name="search" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or subject reference" />
              </label>
              <label className="filter-select">
                <span className="visually-hidden">Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="all">All statuses</option>
                  {Object.entries(ws.statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <Icon name="down" />
              </label>
              <span className="privacy-count"><strong>{shown.length}</strong> matching {shown.length === 1 ? "record" : "records"}</span>
            </div>

            {shown.length === 0 ? (
              <div className="privacy-empty">
                <span className="empty-icon"><Icon name={ws.icon} size={22} /></span>
                <strong>{list.length === 0 ? `No ${ws.label.toLowerCase()} yet` : "No record matches"}</strong>
                <p>{list.length === 0 ? `Use "${ws.button}" when one comes in.` : "Try another title, reference or status."}</p>
                {list.length === 0 && (
                  <button className="action-button" onClick={() => setRecording(true)}><Icon name="plus" size={14} /> {ws.button}</button>
                )}
              </div>
            ) : (
              <ul className="privacy-list">
                {paged.items.map((r) => {
                  const days = r.dueAt ? daysUntil(r.dueAt) : null;
                  const open = ws.open.includes(r.status);
                  return (
                    <li key={r.id} className="privacy-row">
                      <div className="privacy-row-main">
                        <span className="privacy-row-title">{r.title}</span>
                        <span className="privacy-row-ref">{r.id} · {r.subjectRef}</span>
                      </div>
                      <span className="privacy-type-pill">{ws.types[r.type] ?? r.type}</span>
                      <span className={`privacy-status-pill privacy-status-${r.status}`}>{ws.statuses[r.status] ?? r.status}</span>
                      <span className="privacy-dates">
                        Received {formatDate(r.receivedAt)}
                        {days != null && open && (
                          <span className={`privacy-due ${days <= 7 ? "privacy-due-soon" : ""}`}>
                            {days < 0 ? `Overdue by ${-days} days` : days === 0 ? "Due today" : `Due in ${days} days`}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {shown.length > 0 && (
              <Pagination {...paged.props} itemLabel="records" />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
