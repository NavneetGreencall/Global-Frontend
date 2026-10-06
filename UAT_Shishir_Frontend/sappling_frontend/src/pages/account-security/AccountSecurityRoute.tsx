import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AccountSecurity from "./AccountSecurityPage";
import { PageError, PageLoading } from "@/components/ui/PageState";
import { listActiveSessions, listSecurityEvents, revokeActiveSession, revokeOtherSessions } from "@/lib/backend-api/auth";
import { eventsFrom, toActivityItem, toSessionItem } from "./securityAdapter";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Account Security: connects the page to auth.ts.

   - Sessions:  listActiveSessions()  (also gives passwordChangedAt)
   - Activity:  listSecurityEvents()
   - Revoke:    revokeActiveSession(id) / revokeOtherSessions()
   - Change password: opens the same "Set a new password" step as sign-in
   After a revoke, both lists reload from the server.
   ===================================================================== */

const SESSIONS_KEY = ["auth", "sessions"] as const;
const EVENTS_KEY = ["auth", "security-events"] as const;
const EVENTS_LIMIT = 50;

const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

function LiveAccountSecurity() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const sessions = useQuery({ queryKey: SESSIONS_KEY, queryFn: listActiveSessions, staleTime: 0 });
  const events = useQuery({ queryKey: EVENTS_KEY, queryFn: () => listSecurityEvents({ limit: EVENTS_LIMIT }), staleTime: 0 });

  const reloadBoth = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY }),
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY }),
    ]);

  if (sessions.isError && !sessions.data) return <PageError message={messageOf(sessions.error)} onRetry={() => sessions.refetch()} />;
  if (!sessions.data) return <PageLoading label="Loading your sessions…" />;

  return (
    <AccountSecurity
      sessions={sessions.data.items.map(toSessionItem)}
      passwordUpdatedAt={sessions.data.passwordChangedAt}
      activity={eventsFrom(events.data).map(toActivityItem)}
      activityError={events.isError ? messageOf(events.error) : null}
      onRevoke={async (s) => {
        await revokeActiveSession(s.id);
        await reloadBoth();
      }}
      onRevokeOthers={async () => {
        await revokeOtherSessions();
        await reloadBoth();
      }}
      onChangePassword={() => navigate(`/auth?step=password&next=${encodeURIComponent("/admin/security")}`)}
    />
  );
}

export default function AccountSecurityRoute() {
  return USE_SAMPLE_DATA ? <AccountSecurity /> : <LiveAccountSecurity />;
}
