import { createContext, Suspense, useContext, useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SAPLING_LOGO } from "./brand";
import { HeaderView } from "./Header";
import type { HeaderProps } from "./Header";
import { SidebarView } from "./Sidebar";
import type { SidebarProps } from "./Sidebar";
import type { ShellProps } from "./types";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { SAMPLE_USER } from "@/sample-data/user";

/* =====================================================================
   Shared layout

   <AppLayout> draws the sidebar and header ONCE and keeps them on screen
   while pages change underneath (see App.jsx). Pages still render
   <Sidebar> and <Header>, but inside the layout those render nothing, so
   every page also keeps working on its own.
   ===================================================================== */

const ShellContext = createContext(false);

export function Sidebar(props: SidebarProps) {
  return useContext(ShellContext) ? null : <SidebarView {...props} />;
}

export function Header(props: HeaderProps) {
  return useContext(ShellContext) ? null : <HeaderView {...props} />;
}

/** While a page's code loads: the same skeleton as while its data loads */
function ContentLoader() {
  return <PageSkeleton label="Loading page…" />;
}

/**
 * The app shell (sidebar + header) with a loading skeleton, for before the
 * signed-in user is known (e.g. while the session is checked on first load).
 */
export function ShellSkeleton({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="app app-shell">
      <SidebarView
        logoSrc={SAPLING_LOGO}
        orgName="Sapling Global"
        user={{ name: "…", role: "Signing in", onSignOut: () => {} }}
        open={false}
        onClose={() => {}}
        counts={{}}
      />
      <div className="app-main">
        <HeaderView onMenu={() => {}} onSearch={() => {}} />
        <PageSkeleton label={label} />
      </div>
    </div>
  );
}

export function AppLayout({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  user = SAMPLE_USER,
  onSearch,
  navCounts,
}: ShellProps & { navCounts?: Record<string, number> }) {
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Header search: the Cases register searches candidates, case numbers and clients
  const search = onSearch ?? ((q: string) => {
    const term = q.trim();
    if (term) navigate(`/admin/cases?search=${encodeURIComponent(term)}`);
  });

  // New page: close the mobile menu and start at the top
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  // Turn plain <a href="/admin/..."> clicks into in-app navigation (no reload)
  const handleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  };

  return (
    <ShellContext.Provider value={true}>
      <div className="app app-shell" onClick={handleClick}>
        <SidebarView logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} counts={navCounts} />
        <div className="app-main">
          <HeaderView onMenu={() => setMenu(true)} onSearch={search} user={user} />
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
