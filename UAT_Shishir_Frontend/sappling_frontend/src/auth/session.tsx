import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getSession, logout } from "@/lib/backend-api/auth";
import { getNavigationCounts, toNavCounts } from "@/api/operations";
import type { Session } from "@/lib/backend-api/auth";
import { AppLayout, ShellSkeleton } from "@/layout";
import { PageError } from "@/components/ui/PageState";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Signed-in session

   - The session comes from getSession() (GET /auth/me) and is cached by
     React Query under SESSION_KEY.
   - RequireAuth: shows the page only when signed in; otherwise sends the
     person to /auth and brings them back afterwards.
   - SessionLayout: the normal app layout, with the real user in the sidebar.
   - In sample-data mode (VITE_USE_SAMPLE_DATA=true) no sign-in is needed.
   ===================================================================== */

export const SESSION_KEY = ["session"] as const;

/**
 * HTTP status of a failed request, if there is one.
 * Different API clients store it under different names, so this checks the
 * usual places, and finally the error text ("Unauthorized", "Forbidden").
 * Sign-in redirects depend on this: 401/403 → the Sign in page.
 */
export function statusOf(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as Record<string, any>;
  const candidates = [
    e.status, e.statusCode, e.httpStatus, e.code,
    e.response?.status, e.problem?.status, e.body?.status, e.data?.status, e.details?.status, e.cause?.status,
  ];
  const found = candidates.find((v) => typeof v === "number" && v >= 100 && v < 600);
  if (found) return found;
  const text = `${e.title ?? ""} ${e.message ?? ""} ${e.name ?? ""} ${e.type ?? ""}`.toLowerCase();
  if (/unauthori[sz]ed|\b401\b|not signed in|session (has )?(expired|ended)/.test(text)) return 401;
  if (/forbidden|\b403\b/.test(text)) return 403;
  return undefined;
}

/** "PLATFORM_ADMIN" → "Platform Admin" */
export function roleLabel(roles: string[]): string {
  const first = roles[0];
  if (!first) return "User";
  return first
    .replace(/^ROLE_/i, "")
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function useSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: getSession,
    enabled: !USE_SAMPLE_DATA, // sample mode: no sign-in, so never ask the API
    retry: false, // a 401 means "signed out", not something to retry
    staleTime: 5 * 60_000,
  });
}

/** Where to go after signing in: the page they asked for, or the Control Tower */
export function afterLoginPath(search: string): string {
  const next = new URLSearchParams(search).get("next");
  return next && next.startsWith("/admin") ? next : "/admin";
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const session = useSession();

  if (USE_SAMPLE_DATA) return <>{children}</>;
  if (session.isPending) return <ShellSkeleton label="Checking your session…" />;

  if (session.isError) {
    const status = statusOf(session.error);
    if (status === 401 || status === 403) {
      const next = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/auth?next=${next}`} replace />;
    }
    const message = session.error instanceof Error ? session.error.message : "Can't reach the server.";
    return <PageError message={message} onRetry={() => session.refetch()} />;
  }

  // Signed in, but a new password is required first
  if (session.data.mustChangePassword) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?step=password&next=${next}`} replace />;
  }

  return <>{children}</>;
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    try {
      await logout();
    } catch {
      // the session may already have ended; carry on to the sign-in page
    } finally {
      queryClient.clear(); // forget every cached page, including the session
      navigate("/auth", { replace: true });
    }
  };
}

function shellUser(session: Session | undefined, onSignOut: () => void) {
  if (!session) return undefined; // sample mode: AppLayout shows its default user
  return { name: session.displayName || session.email, role: roleLabel(session.roles), onSignOut };
}

export function SessionLayout() {
  const session = useSession();
  const signOut = useSignOut();
  const data = USE_SAMPLE_DATA ? undefined : session.data;
  // Live sidebar badges (open cases, QA, exceptions); refreshed every minute
  const nav = useQuery({
    queryKey: ["dashboards", "navigation"],
    queryFn: getNavigationCounts,
    enabled: !USE_SAMPLE_DATA && Boolean(session.data),
    refetchInterval: 60_000,
  });
  const navCounts = USE_SAMPLE_DATA ? undefined : nav.data ? toNavCounts(nav.data) : {};
  return <AppLayout user={shellUser(data, signOut)} orgName={data?.tenantName || undefined} navCounts={navCounts} />;
}
