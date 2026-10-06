import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { Icon } from "./icons";
import type { ShellUser } from "./types";
import { SAMPLE_NOTIFICATIONS } from "@/sample-data/notifications";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Header: search, Help, Refresh, Notifications, Account security.
   ===================================================================== */

export interface HeaderNotification {
  id: string;
  title: string;
  text: string;
  at: string; // ISO date-time
  href?: string; // where clicking it goes
  read?: boolean;
}

export interface HeaderProps {
  onMenu: () => void;
  onSearch: (query: string) => void;
  /** live mode: pass notifications from the API here (none are loaded yet) */
  notifications?: HeaderNotification[];
  /** the signed-in user: initials in the avatar, and Sign out */
  user?: ShellUser;
}


/** "Nikhil Sharma" → "NS", "Nikhil" → "N" */
const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (m < 60) return `${m || 1} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

/** A button that opens a small panel under it; closes on outside click or Escape */
function Popover({ button, label, children, wide }: { button: ReactNode; label: string; children: (close: () => void) => ReactNode; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div className="topbar-popover-wrap" ref={ref}>
      <button className={`icon-button ${open ? "is-open" : ""}`} aria-label={label} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((o) => !o)}>
        {button}
      </button>
      {open && <div className={`topbar-popover ${wide ? "is-wide" : ""}`} role="dialog" aria-label={label}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

export function HeaderView({ onMenu, onSearch, notifications, user }: HeaderProps) {
  const ref = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const fetching = useIsFetching();
  const [spinning, setSpinning] = useState(false);
  const [items, setItems] = useState<HeaderNotification[]>(notifications ?? (USE_SAMPLE_DATA ? SAMPLE_NOTIFICATIONS : []));
  useEffect(() => { if (notifications) setItems(notifications); }, [notifications]);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  // Reload every list and dashboard on screen from the API
  const refresh = async () => {
    setSpinning(true);
    try {
      if (!USE_SAMPLE_DATA) await queryClient.invalidateQueries();
      else await new Promise((r) => setTimeout(r, 500)); // sample data: nothing to reload
    } finally {
      setSpinning(false);
    }
  };
  const busy = spinning || fetching > 0;

  return (
    <header className="topbar">
      <button className="icon-button topbar-menu" aria-label="Open menu" onClick={onMenu}>
        <Icon n="menu" />
      </button>
      <form
        className="topbar-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(ref.current?.value ?? "");
        }}
      >
        <label htmlFor="m-q" className="visually-hidden">Search</label>
        <Icon n="search" s={17} />
        <input id="m-q" ref={ref} type="search" placeholder="Search candidate, case or client" />
        <kbd>Ctrl K</kbd>
      </form>

      <div className="topbar-actions">
        {/* Help */}
        <Popover label="Help" button={<><Icon n="help" /><span className="topbar-button-label">Help</span></>}>
          {() => (
            <div className="help-panel">
              <strong className="popover-title">Help</strong>
              <ul className="help-list">
                <li><kbd>Ctrl</kbd> + <kbd>K</kbd><span>Jump to search</span></li>
                <li><kbd>Esc</kbd><span>Close a dialog or panel</span></li>
                <li><Icon n="refresh" s={14} /><span>Reload the data on this page</span></li>
              </ul>
              <p className={`help-mode ${USE_SAMPLE_DATA ? "is-sample" : "is-live"}`}>
                {USE_SAMPLE_DATA ? "Showing sample data. Nothing you do here is saved." : "Connected to the live API."}
              </p>
            </div>
          )}
        </Popover>

        {/* Refresh */}
        <button className="icon-button" aria-label="Refresh data" title="Refresh data" onClick={refresh} disabled={spinning}>
          <span className={`icon-glyph ${busy ? "is-spinning" : ""}`}><Icon n="refresh" /></span>
        </button>

        {/* Notifications */}
        <Popover
          label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          wide
          button={<><Icon n="bell" />{unread > 0 && <span className="bell-count">{unread > 9 ? "9+" : unread}</span>}</>}
        >
          {(close) => (
            <div className="notice-panel">
              <div className="notice-head">
                <strong className="popover-title">Notifications</strong>
                {unread > 0 && (
                  <button className="notice-mark" onClick={() => setItems((all) => all.map((n) => ({ ...n, read: true })))}>Mark all as read</button>
                )}
              </div>
              {items.length === 0 ? (
                <p className="notice-empty">You're all caught up.</p>
              ) : (
                <ul className="notice-list">
                  {items.map((n) => {
                    const body = (
                      <>
                        <span className="notice-title">{!n.read && <i className="notice-dot" />}{n.title}</span>
                        <span className="notice-text">{n.text}</span>
                        <span className="notice-time">{ago(n.at)}</span>
                      </>
                    );
                    const markRead = () => { setItems((all) => all.map((x) => (x.id === n.id ? { ...x, read: true } : x))); close(); };
                    return (
                      <li key={n.id} className={n.read ? "" : "is-unread"}>
                        {n.href ? <Link to={n.href} className="notice-item" onClick={markRead}>{body}</Link> : <div className="notice-item">{body}</div>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </Popover>

        {/* Account security shortcut */}
        <Link to="/admin/security" className="icon-button" aria-label="Account security" title="Account security">
          <Icon n="shield" />
        </Link>

        {/* Signed-in user: initials; the panel shows who and offers Sign out */}
        {user && (
          <Popover label={`Signed in as ${user.name}`} button={<span className="topbar-avatar" aria-hidden="true">{initialsOf(user.name)}</span>}>
            {(close) => (
              <div className="account-panel">
                <div className="account-who">
                  <span className="topbar-avatar is-large" aria-hidden="true">{initialsOf(user.name)}</span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.role}</small>
                  </span>
                </div>
                <Link to="/admin/security" className="account-link" onClick={close}><Icon n="shield" s={16} /> Account security</Link>
                <button className="account-link is-danger" onClick={() => { close(); user.onSignOut(); }}><Icon n="out" s={16} /> Sign out</button>
              </div>
            )}
          </Popover>
        )}

        {/* Sign out */}
        {user && (
          <button className="icon-button" aria-label="Sign out" title="Sign out" onClick={user.onSignOut}>
            <Icon n="out" />
          </button>
        )}
      </div>
    </header>
  );
}
