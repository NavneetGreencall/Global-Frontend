import { Link, useLocation } from "react-router-dom";
import { Icon } from "./icons";
import { NAV } from "./navigation";
import type { ShellUser } from "./types";

/* =====================================================================
   Sidebar
   ===================================================================== */

export interface SidebarProps {
  /** live badge counts by nav item id; when given, items without a count show no badge */
  counts?: Record<string, number>;
  activeId?: string;
  logoSrc?: string;
  orgName?: string;
  user: ShellUser;
  open: boolean;
  onClose: () => void;
}

export function SidebarView({ activeId, logoSrc, orgName = "Sapling Global", user, open, onClose, counts }: SidebarProps) {
  const { pathname } = useLocation();
  return (
    <>
      <div className={`sidebar-overlay ${open ? "is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          {logoSrc && <img className="brand-logo" src={logoSrc} alt="" />}
          <div className="brand-text">
            <span className="brand-name">{orgName}</span>
            <span className="brand-meta">{user.role} · IST</span>
          </div>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={onClose}>
            <Icon n="x" />
          </button>
        </div>

        <nav className="nav" aria-label="Main">
          {NAV.map((g) => (
            <div className="nav-group" key={g.section}>
              <span className="nav-heading">{g.section}</span>
              {g.items.map((it) => {
                const active = activeId
                  ? it.id === activeId
                  : it.href === "/admin"
                  ? pathname === "/admin" || pathname === "/admin/"
                  : pathname.startsWith(it.href);
                return (
                  <Link
                    key={it.id}
                    to={it.href}
                    onClick={onClose}
                    className={`nav-item ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon n={it.icon} />
                    <span className="nav-label">{it.label}</span>
                    {(counts ? counts[it.id] : it.count) != null && (
                      <span className={`nav-count ${it.urgent ? "is-urgent" : ""}`}>{counts ? counts[it.id] : it.count}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="user-card">
          <span className="user-avatar">{user.name[0]}</span>
          <div className="user-text">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="icon-button" aria-label="Sign out" onClick={user.onSignOut}>
            <Icon n="out" s={17} />
          </button>
        </div>
      </aside>
    </>
  );
}
