import { useEffect, useMemo, useRef, useState } from "react";
import { Header, Sidebar, SAPLING_LOGO } from "./ControlTower";
import "../Styles/ControlTower.css";
import "../Styles/ReleasedReports.css";
import "../Styles/Useraccess.css";

/* =====================================================================
   User IDs & access

   The first six users come from your live page; the last three are
   SAMPLE rows so every role and status shows. Pass real data with:
     <UsersAccess users={items} totalUsers={38} />

   status:    "active" | "invited" | "disabled"
   lastLogin: ISO date-time, or null if the user has never signed in
   ===================================================================== */

const USERS = [
  { id: "u1", name: "Acme Client Admin", email: "client@acme.local", roles: ["client_admin"], scope: "Head Office", status: "active", lastLogin: "2026-08-25T18:02:00+05:30" },
  { id: "u2", name: "CEO", email: "acmetechsolutions@gmail.com", roles: ["client_admin"], scope: "All branches", status: "active", lastLogin: "2026-09-30T13:01:00+05:30" },
  { id: "u3", name: "CEO", email: "nikhil@gmail.com", roles: ["client_admin"], scope: "All branches", status: "active", lastLogin: "2026-09-12T12:10:00+05:30" },
  { id: "u4", name: "Client Admin", email: "uat.clientadmin@greencall.com", roles: ["client_admin"], scope: "All branches", status: "active", lastLogin: "2026-09-29T09:28:00+05:30" },
  { id: "u5", name: "Client Administrator", email: "client@greencall.com", roles: ["client_admin"], scope: "All branches", status: "active", lastLogin: "2026-09-14T12:21:00+05:30" },
  { id: "u6", name: "Field Executive", email: "field@greencall.com", roles: ["field_executive"], scope: "Head Office", status: "active", lastLogin: "2026-09-14T10:02:00+05:30" },
  // SAMPLE rows below — replace with real data
  { id: "u7", name: "Verification Specialist", email: "verifier@greencall.com", roles: ["verifier", "qa_reviewer"], scope: "Head Office", status: "active", lastLogin: "2026-09-29T17:40:00+05:30" },
  { id: "u8", name: "New Operations User", email: "ops.new@greencall.com", roles: ["operations"], scope: "Head Office", status: "invited", lastLogin: null },
  { id: "u9", name: "Former Verifier", email: "old.verifier@greencall.com", roles: ["verifier"], scope: "All branches", status: "disabled", lastLogin: "2026-06-02T11:15:00+05:30" },
];

const ROLES = {
  platform_admin: { label: "Platform Admin", color: "green" },
  client_admin: { label: "Client Admin", color: "blue" },
  operations: { label: "Operations", color: "teal" },
  verifier: { label: "Verifier", color: "violet" },
  qa_reviewer: { label: "QA Reviewer", color: "violet" },
  field_executive: { label: "Field Executive", color: "orange" },
};

const STATUSES = {
  active: "Active",
  invited: "Invited",
  disabled: "Disabled",
};

const PAGE_SIZE = 10;
const STALE_DAYS = 30; // "not signed in recently" threshold

/* ---------- helpers ---------- */

const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const formatLogin = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
  });

// Calendar days between a sign-in and today, counted in India time
const istDay = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // "2026-09-30"
const daysSince = (iso) => Math.round((new Date(istDay(Date.now())) - new Date(istDay(iso))) / 86400000);

const ago = (iso) => {
  const d = daysSince(iso);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
};

/* ---------- icons ---------- */

const ICONS = {
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M4 7l8 6 8-6" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  down: <path d="M7 10l5 5 5-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  more: <><circle cx="6" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18" cy="12" r="1.3" /></>,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
};

const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- the ⋯ menu on each row ---------- */

function UserMenu({ user, onEditRoles, onResetPassword, onToggleStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const pick = (fn) => { fn(user); setOpen(false); };

  return (
    <div className="users-menu" ref={ref}>
      <button
        className="users-menu-button"
        aria-label={`Actions for ${user.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="more" />
      </button>
      {open && (
        <div className="users-menu-list" role="menu">
          <button role="menuitem" onClick={() => pick(onEditRoles)}>Edit roles and scope</button>
          <button role="menuitem" onClick={() => pick(onResetPassword)}>
            {user.status === "invited" ? "Resend invite" : "Reset password"}
          </button>
          <button role="menuitem" className={user.status === "disabled" ? "" : "users-menu-danger"} onClick={() => pick(onToggleStatus)}>
            {user.status === "disabled" ? "Re-enable user" : "Disable user"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- page ---------- */

export default function UsersAccess({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  users = USERS,
  totalUsers = 38,
  user = { name: "Nikhil", role: "Platform Admin", onSignOut: () => {} },
  onCreate = () => console.log("create user ID"),
  onEditRoles = (u) => console.log("edit roles", u.id),
  onResetPassword = (u) => console.log("reset password", u.id),
  onToggleStatus = (u) => console.log("toggle status", u.id),
  onSearch = (q) => console.log("search", q),
}) {
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const summary = [
    { icon: "users", label: "Platform users", value: totalUsers, note: `${users.length} loaded on this page` },
    { icon: "check", label: "Active", value: users.filter((u) => u.status === "active").length, note: "Can sign in today" },
    { icon: "mail", label: "Invited", value: users.filter((u) => u.status === "invited").length, note: "Haven't accepted yet" },
    {
      icon: "clock",
      label: "Not signed in lately",
      value: users.filter((u) => u.status === "active" && (!u.lastLogin || daysSince(u.lastLogin) > STALE_DAYS)).length,
      note: `No sign-in for ${STALE_DAYS}+ days`,
    },
  ];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => role === "all" || u.roles.includes(role))
      .filter((u) => status === "all" || u.status === status)
      .filter((u) => !q || [u.name, u.email].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, query, role, status]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const clearFilters = () => { setQuery(""); setRole("all"); setStatus("all"); setPage(1); };

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page users-page">
          {/* Page header */}
          <header className="page-header users-header">
            <div>
              <p className="page-eyebrow">Platform</p>
              <h1 className="page-title">User IDs &amp; access</h1>
              <p className="page-subtitle">{totalUsers} platform users, their roles, scope and sign-in activity.</p>
            </div>
            <button className="create-user-button" onClick={onCreate}>
              <Icon name="plus" size={15} /> Create user ID
            </button>
          </header>

          {/* Summary cards */}
          <div className="summary-cards">
            {summary.map((s) => (
              <div key={s.label} className="summary-card">
                <div className="summary-card-top">
                  <span className="summary-card-label">{s.label}</span>
                  <span className="summary-card-icon"><Icon name={s.icon} /></span>
                </div>
                <strong className="summary-card-value">{s.value}</strong>
                <span className="summary-card-note">{s.note}</span>
              </div>
            ))}
          </div>

          {/* Users table */}
          <section className="users-card" aria-label="Platform users">
            <div className="users-toolbar">
              <label className="search-box">
                <span className="visually-hidden">Search users</span>
                <Icon name="search" />
                <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search name or email" />
              </label>

              <label className="filter-select">
                <span className="visually-hidden">Role</span>
                <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
                  <option value="all">All roles</option>
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <Icon name="down" />
              </label>

              <label className="filter-select">
                <span className="visually-hidden">Status</span>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                  <option value="all">All statuses</option>
                  {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <Icon name="down" />
              </label>

              <span className="users-count">
                Showing <strong>{list.length}</strong> of <strong>{users.length}</strong> loaded
              </span>
            </div>

            {rows.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon"><Icon name="search" size={22} /></span>
                <strong>No user matches</strong>
                <p>Try another name, role or status.</p>
                <button className="action-button" onClick={clearFilters}>Clear filters</button>
              </div>
            ) : (
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Roles</th>
                      <th>Scope</th>
                      <th>Status</th>
                      <th>Last sign-in</th>
                      <th><span className="visually-hidden">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => (
                      <tr key={u.id} className={u.status === "disabled" ? "users-row-disabled" : ""}>
                        <td>
                          <div className="users-person">
                            <span className="users-avatar">{initials(u.name)}</span>
                            <div>
                              <span className="users-name">{u.name}</span>
                              <span className="users-email">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="role-list">
                            {u.roles.map((r) => (
                              <span key={r} className={`role-pill role-${ROLES[r]?.color ?? "green"}`}>
                                {ROLES[r]?.label ?? r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="users-scope">{u.scope}</td>
                        <td>
                          <span className={`users-status users-status-${u.status}`}>
                            <i />{STATUSES[u.status] ?? u.status}
                          </span>
                        </td>
                        <td>
                          {u.lastLogin ? (
                            <div className="last-login">
                              <span className="last-login-date">{formatLogin(u.lastLogin)}</span>
                              <span className={`last-login-ago ${daysSince(u.lastLogin) > STALE_DAYS ? "last-login-stale" : ""}`}>
                                {ago(u.lastLogin)}
                              </span>
                            </div>
                          ) : (
                            <span className="last-login-ago">Never signed in</span>
                          )}
                        </td>
                        <td className="users-actions">
                          <UserMenu user={u} onEditRoles={onEditRoles} onResetPassword={onResetPassword} onToggleStatus={onToggleStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <footer className="users-footer">
              <span>Page <strong>{current}</strong> of <strong>{pages}</strong></span>
              <nav className="pager" aria-label="Pagination">
                <button className="pager-button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
                  <Icon name="left" />
                </button>
                <button className="pager-button" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page">
                  <Icon name="right" />
                </button>
              </nav>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}