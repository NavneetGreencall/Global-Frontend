import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import UsersAccess from "./UsersAccessPage";
import CreateUserDialog, { generatePassword } from "./CreateUserDialog";
import type { PlatformUser, UserFilters } from "./UsersAccessPage";
import { API_STATUS, toPlatformUser, toRoleOptions } from "./usersAdapter";
import { PageError, PageLoading, filtersFromParams, filtersToParams, useFeedback } from "@/components/ui";
import { listRoles, listUsers, resetUserPassword, updateUser } from "@/lib/backend-api/users";
import type { DirectoryUser } from "@/lib/backend-api/users";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   User IDs & Access: connects the page to users.ts.

   - List:     listUsers({ search, role, status, page, pageSize })
   - Roles:    listRoles()  (role filter)
   - Suspend / re-enable:  updateUser(id, { version, status })
   - Reset password:       resetUserPassword(id, temporaryPassword)
   Filters and page live in the URL (/admin/users?search=…&page=2).
   ===================================================================== */

const PAGE_SIZE = 10;
const DEFAULTS: UserFilters = { search: "", role: "all", status: "all" };
const MIN_TEMP_PASSWORD = 12; // adjust to the backend's password rule
const KEY = ["users"] as const;

const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function LiveUsersAccess() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const f = filtersFromParams(params, DEFAULTS);
  const search = useDebounced(f.search.trim());

  const [creating, setCreating] = useState(false);
  const { confirm, prompt, toast } = useFeedback();
  const users = useQuery({
    queryKey: [...KEY, f.page, search, f.role, f.status],
    queryFn: () =>
      listUsers({
        search: search || undefined,
        role: f.role === "all" ? undefined : f.role.toUpperCase(),
        status: API_STATUS[f.status],
        page: f.page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });
  const roles = useQuery({ queryKey: ["users", "roles"], queryFn: listRoles, staleTime: 10 * 60_000 });

  // keep the last page that loaded, so a failed reload keeps rows on screen
  const lastGood = useRef(users.data);
  if (users.data) lastGood.current = users.data;
  const shown = users.data ?? lastGood.current;

  if (!shown) {
    if (users.isError) return <PageError message={messageOf(users.error)} onRetry={() => users.refetch()} />;
    return <PageLoading label="Loading users…" />;
  }

  // the API record behind each row (needed for its version number)
  const byId = new Map<string, DirectoryUser>(shown.items.map((u) => [u.id, u]));
  const reload = () => queryClient.invalidateQueries({ queryKey: KEY });

  const onChange = (next: Partial<UserFilters> & { page?: number }) =>
    setParams(filtersToParams({ ...f, ...next } as UserFilters & { page: number }, DEFAULTS), { replace: true });

  const toggleStatus = async (u: PlatformUser) => {
    const record = byId.get(u.id);
    if (!record) return;
    const enabling = u.status === "disabled";
    const ok = await confirm(
      enabling
        ? { title: `Re-enable ${u.name}?`, message: "They will be able to sign in again.", confirmLabel: "Re-enable" }
        : { title: `Suspend ${u.name}?`, message: "They won't be able to sign in until re-enabled.", confirmLabel: "Suspend", danger: true }
    );
    if (!ok) return;
    try {
      await updateUser(u.id, { version: record.version, status: enabling ? "ACTIVE" : "SUSPENDED" });
      await reload();
      toast(enabling ? `${u.name} can sign in again` : `${u.name} is suspended`);
    } catch (err) {
      toast(`Couldn't update ${u.name}: ${messageOf(err)}`, "error");
      await reload(); // e.g. 409: someone else changed this user; show the latest
    }
  };

  const resetPassword = async (u: PlatformUser) => {
    const temp = await prompt({
      title: `Reset password for ${u.name}`,
      message: "Set a temporary password and share it securely. They'll be asked to change it at next sign-in.",
      label: "Temporary password",
      minLength: MIN_TEMP_PASSWORD,
      generate: () => generatePassword(),
      confirmLabel: "Set password",
    });
    if (temp === null) return;
    try {
      await resetUserPassword(u.id, temp);
      toast(`Temporary password set for ${u.name}. Share it with them securely.`);
    } catch (err) {
      toast(`Couldn't reset the password: ${messageOf(err)}`, "error");
    }
  };

  const notYet = (what: string) => () =>
    toast(`${what} isn't available in this dashboard yet. Use the existing admin screen for now.`, "info");

  return (
    <>
    <UsersAccess
      users={shown.items.map(toPlatformUser)}
      totalUsers={shown.total}
      roleOptions={roles.data ? toRoleOptions(roles.data.items) : undefined}
      server={{
        filters: { search: f.search, role: f.role, status: f.status },
        page: users.data ? f.page : shown.page,
        pageSize: shown.pageSize || PAGE_SIZE,
        total: shown.total,
        loading: users.isFetching,
        error: users.isError ? messageOf(users.error) : null,
        onRetry: () => users.refetch(),
        onChange,
      }}
      onToggleStatus={toggleStatus}
      onResetPassword={resetPassword}
      onEditRoles={notYet("Editing roles")}
      onCreate={() => setCreating(true)}
    />
    {creating && <CreateUserDialog onClose={() => setCreating(false)} onCreated={() => reload()} />}
    </>
  );
}

/** Sample mode: the page's own sample users, but "Create user ID" still opens the dialog */
function SampleUsersAccess() {
  const [creating, setCreating] = useState(false);
  return (
    <>
      <UsersAccess onCreate={() => setCreating(true)} />
      {creating && <CreateUserDialog onClose={() => setCreating(false)} onCreated={() => {}} />}
    </>
  );
}

export default function UsersAccessRoute() {
  return USE_SAMPLE_DATA ? <SampleUsersAccess /> : <LiveUsersAccess />;
}
