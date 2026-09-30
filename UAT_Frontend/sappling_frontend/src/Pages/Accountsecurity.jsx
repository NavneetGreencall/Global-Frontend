import { useMemo, useState } from "react";
import { Header, Sidebar, SAPLING_LOGO } from "./ControlTower";
import "../Styles/ControlTower.css";
import "../Styles/ReleasedReports.css";
import "../Styles/Accountsecurity.css";

/* =====================================================================
   Account security

   Sessions, the three sign-ins and the password date come from your
   live page; the failed sign-in is a SAMPLE event. Pass real data with:
     <AccountSecurity sessions={...} activity={...} passwordUpdatedAt="..." />

   activity type: "login" | "failed" | "password" | "anomaly"
   ===================================================================== */

const PASSWORD_UPDATED_AT = "2026-09-07T15:49:00+05:30";

const SESSIONS = [
  {
    id: "s1", name: "Current browser session", current: true,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0",
    location: null, ip: "182.78.76.2", startedAt: "2026-09-30T15:53:00+05:30", expiresAt: "2026-10-07T15:53:00+05:30",
  },
  {
    id: "s2", name: "Unnamed browser session", current: false,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
    location: null, ip: "122.176.104.152", startedAt: "2026-09-29T12:00:00+05:30", expiresAt: "2026-10-06T12:00:00+05:30",
  },
];

const CHROME_153 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36";

const ACTIVITY = [
  { id: "a1", type: "login", title: "Sign-in succeeded", device: "Local device", ip: "127.0.0.1", userAgent: CHROME_153, at: "2026-09-29T15:37:00+05:30" },
  { id: "a2", type: "login", title: "Sign-in succeeded", device: "Local device", ip: "127.0.0.1", userAgent: CHROME_153, at: "2026-09-29T15:25:00+05:30" },
  { id: "a3", type: "login", title: "Sign-in succeeded", device: "Local device", ip: "127.0.0.1", userAgent: CHROME_153, at: "2026-09-29T13:30:00+05:30" },
  { id: "a4", type: "password", title: "Password changed", device: "Local device", ip: "127.0.0.1", userAgent: CHROME_153, at: PASSWORD_UPDATED_AT },
  // SAMPLE event below — replace with real data
  { id: "a5", type: "failed", title: "Sign-in failed: wrong password", device: "Unrecognised device", ip: "10.0.4.18", userAgent: CHROME_153, at: "2026-09-05T09:12:00+05:30" },
];

const ACTIVITY_TYPES = {
  login: "Sign-in",
  failed: "Failed",
  password: "Password",
  anomaly: "Anomaly",
};

const SHOW_STEP = 5;

/* ---------- helpers ---------- */

const formatTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
  }) + " IST";

const istDay = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const daysSince = (iso) => Math.round((new Date(istDay(Date.now())) - new Date(istDay(iso))) / 86400000);

// Turn a long user-agent string into "Edge 154 on Windows"
function describeBrowser(ua) {
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Unknown system";
  const pick = (re, name) => { const m = ua.match(re); return m ? `${name} ${m[1]}` : null; };
  const browser =
    pick(/Edg\/(\d+)/, "Edge") ||
    pick(/OPR\/(\d+)/, "Opera") ||
    pick(/Firefox\/(\d+)/, "Firefox") ||
    pick(/Chrome\/(\d+)/, "Chrome") ||
    pick(/Version\/(\d+).*Safari/, "Safari") ||
    "Browser";
  return `${browser} on ${os}`;
}

/* ---------- icons ---------- */

const ICONS = {
  laptop: <><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2.5 19h19" /></>,
  key: <><circle cx="8" cy="15" r="3.5" /><path d="M10.5 12.5L19 4M15.5 7.5l2.5 2.5M13.5 9.5l2 2" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5M12 16h.01" /></>,
  monitor: <><rect x="3.5" y="4.5" width="17" height="12" rx="1.5" /><path d="M9 20h6M12 16.5V20" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  down: <path d="M7 10l5 5 5-5" />,
};

const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- one session ---------- */

function SessionRow({ session, onRevoke }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="session-row">
      <span className="session-icon"><Icon name="monitor" size={18} /></span>

      <div className="session-body">
        <span className="session-name">
          {session.name}
          <span className="session-agent-short">{describeBrowser(session.userAgent)}</span>
        </span>
        <span className="session-agent" title={session.userAgent}>{session.userAgent}</span>
        <span className="session-meta">
          {session.location ?? "Approximate location unavailable"} · IP {session.ip} · Started {formatTime(session.startedAt)} · Expires {formatTime(session.expiresAt)}
        </span>
      </div>

      {session.current ? (
        <span className="this-device-pill"><i />This device</span>
      ) : confirming ? (
        <span className="revoke-confirm" role="group" aria-label="Confirm revoke">
          Sign this device out?
          <button className="revoke-yes" onClick={() => onRevoke(session)}>Revoke</button>
          <button className="revoke-no" onClick={() => setConfirming(false)}>Cancel</button>
        </span>
      ) : (
        <button className="revoke-button" onClick={() => setConfirming(true)}>Revoke</button>
      )}
    </li>
  );
}

/* ---------- page ---------- */

export default function AccountSecurity({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  sessions: initialSessions = SESSIONS,
  activity = ACTIVITY,
  passwordUpdatedAt = PASSWORD_UPDATED_AT,
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onRevoke = (s) => console.log("revoke session", s.id),
  onRevokeOthers = () => console.log("revoke all other sessions"),
  onChangePassword = () => console.log("change password"),
  onSearch = (q) => console.log("search", q),
}) {
  const [menu, setMenu] = useState(false);
  const [sessions, setSessions] = useState(initialSessions);
  const [confirmAll, setConfirmAll] = useState(false);
  const [type, setType] = useState("all");
  const [shown, setShown] = useState(SHOW_STEP);

  const others = sessions.filter((s) => !s.current);
  const passwordDays = daysSince(passwordUpdatedAt);
  const failedRecent = activity.filter((a) => a.type === "failed" && daysSince(a.at) <= 30).length;

  const summary = [
    { icon: "laptop", label: "Active sessions", value: sessions.length, note: others.length ? `${others.length} on other devices` : "Only this device" },
    { icon: "key", label: "Password age", value: `${passwordDays} ${passwordDays === 1 ? "day" : "days"}`, note: `Changed ${formatTime(passwordUpdatedAt)}` },
    { icon: "alert", label: "Failed sign-ins", value: failedRecent, note: "In the last 30 days", alert: failedRecent > 0 },
  ];

  const revoke = async (s) => {
    await onRevoke(s);
    setSessions((list) => list.filter((x) => x.id !== s.id));
  };

  const revokeOthers = async () => {
    await onRevokeOthers();
    setSessions((list) => list.filter((x) => x.current));
    setConfirmAll(false);
  };

  const events = useMemo(
    () => activity.filter((a) => type === "all" || a.type === type).sort((a, b) => new Date(b.at) - new Date(a.at)),
    [activity, type]
  );

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page security-page">
          {/* Page header */}
          <header className="page-header security-header">
            <div>
              <p className="page-eyebrow">Platform</p>
              <h1 className="page-title">Account security</h1>
              <p className="page-subtitle">Password last updated {formatTime(passwordUpdatedAt)}</p>
            </div>
            <button className="change-password-button" onClick={onChangePassword}>
              <Icon name="lock" size={15} /> Change password
            </button>
          </header>

          {/* Summary cards */}
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

          {/* Active sessions */}
          <section className="security-panel" aria-labelledby="sessions-title">
            <header className="security-panel-header">
              <div>
                <h2 id="sessions-title" className="security-panel-title">Active sessions</h2>
                <p className="security-panel-subtitle">Devices currently signed in with your platform identity.</p>
              </div>
              {others.length > 0 && (
                confirmAll ? (
                  <span className="revoke-confirm" role="group" aria-label="Confirm revoke all">
                    Sign out {others.length} other {others.length === 1 ? "device" : "devices"}?
                    <button className="revoke-yes" onClick={revokeOthers}>Revoke all</button>
                    <button className="revoke-no" onClick={() => setConfirmAll(false)}>Cancel</button>
                  </span>
                ) : (
                  <button className="revoke-all-button" onClick={() => setConfirmAll(true)}>Revoke all other sessions</button>
                )
              )}
            </header>

            <ul className="session-list">
              {sessions.map((s) => <SessionRow key={s.id} session={s} onRevoke={revoke} />)}
            </ul>
          </section>

          {/* Authentication activity */}
          <section className="security-panel" aria-labelledby="activity-title">
            <header className="security-panel-header">
              <div>
                <h2 id="activity-title" className="security-panel-title">Authentication activity</h2>
                <p className="security-panel-subtitle">Recent sign-ins, credential changes and anomaly detections.</p>
              </div>
              <label className="filter-select">
                <span className="visually-hidden">Activity type</span>
                <select value={type} onChange={(e) => { setType(e.target.value); setShown(SHOW_STEP); }}>
                  <option value="all">All activity</option>
                  {Object.entries(ACTIVITY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <Icon name="down" />
              </label>
            </header>

            {events.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon"><Icon name="lock" size={22} /></span>
                <strong>No activity of this type</strong>
                <p>Try "All activity".</p>
              </div>
            ) : (
              <ul className="activity-list">
                {events.slice(0, shown).map((a) => (
                  <li key={a.id} className="activity-row">
                    <span className={`activity-pill activity-${a.type}`}>{ACTIVITY_TYPES[a.type] ?? a.type}</span>
                    <div className="activity-body">
                      <span className="activity-title">{a.title}</span>
                      <span className="activity-meta" title={a.userAgent}>
                        {a.device} · IP {a.ip} · {describeBrowser(a.userAgent)}
                      </span>
                    </div>
                    <time className="activity-time" dateTime={a.at}>{formatTime(a.at)}</time>
                  </li>
                ))}
              </ul>
            )}

            {events.length > shown && (
              <button className="show-more-button" onClick={() => setShown((n) => n + SHOW_STEP)}>
                Show {Math.min(SHOW_STEP, events.length - shown)} more
              </button>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}