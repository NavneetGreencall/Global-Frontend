import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Clients from "./ClientsPage";
import OnboardClientDialog from "./OnboardClientDialog";
import type { ClientAccount } from "./ClientsPage";
import { toClientAccount } from "./clientsAdapter";
import { PageError, PageLoading, useFeedback } from "@/components/ui";
import { listClients, updateClient } from "@/lib/backend-api/cases";
import type { ClientOption } from "@/lib/backend-api/cases";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Clients: connects the page to listClients() / updateClient().
   Reads clients page by page (up to MAX_CLIENTS); the page searches,
   sorts and pages them. "Pause / resume" sends updateClient with the
   record's version, so someone else's change isn't overwritten.
   ===================================================================== */

const MAX_CLIENTS = 500;
const KEY = ["clients"] as const;
const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

async function loadClients() {
  const all: ClientOption[] = [];
  for (let page = 1; all.length < MAX_CLIENTS; page += 1) {
    const res = await listClients({ page, pageSize: 100, limit: 100 });
    all.push(...res.items);
    if (res.items.length === 0 || all.length >= res.total) break;
  }
  return all;
}

function LiveClients() {
  const queryClient = useQueryClient();
  const [onboarding, setOnboarding] = useState(false);
  const { confirm, toast } = useFeedback();
  const q = useQuery({ queryKey: KEY, queryFn: loadClients });

  if (q.isError && !q.data) return <PageError message={messageOf(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data) return <PageLoading label="Loading clients…" />;

  const byId = new Map(q.data.map((c) => [c.publicId, c]));

  const pauseOrResume = async (client: ClientAccount) => {
    const record = byId.get(client.id);
    if (!record) return;
    const resuming = client.status === "paused";
    const ok = await confirm(
      resuming
        ? { title: `Resume ${client.name}?`, message: "New work for this client can start again.", confirmLabel: "Resume" }
        : { title: `Pause ${client.name}?`, message: "New work for this client will stop until resumed.", confirmLabel: "Pause", danger: true }
    );
    if (!ok) return;
    try {
      await updateClient(client.id, { version: record.version, status: resuming ? "ACTIVE" : "SUSPENDED" });
      toast(resuming ? `${client.name} resumed` : `${client.name} paused`);
    } catch (err) {
      toast(`Couldn't update ${client.name}: ${messageOf(err)}`, "error");
    } finally {
      await queryClient.invalidateQueries({ queryKey: KEY }); // show the latest, including after a 409
    }
  };

  const clients = q.data.map(toClientAccount);
  return (
    <>
    <Clients
      clients={clients}
      totalAccounts={clients.length}
      onPause={pauseOrResume}
      onEdit={() => toast("Editing client details isn't available in this dashboard yet. Use the existing client screen for now.", "info")}
      onOnboard={() => setOnboarding(true)}
    />
    {onboarding && (
      <OnboardClientDialog onClose={() => setOnboarding(false)} onCreated={(name) => { toast(`${name} onboarded`); queryClient.invalidateQueries({ queryKey: KEY }); }} />
    )}
    </>
  );
}

/** Sample mode: the page's own sample clients, but "Onboard client" still opens the dialog */
function SampleClients() {
  const [onboarding, setOnboarding] = useState(false);
  const { toast } = useFeedback();
  return (
    <>
      <Clients onOnboard={() => setOnboarding(true)} />
      {onboarding && <OnboardClientDialog onClose={() => setOnboarding(false)} onCreated={(name) => toast(`${name} onboarded (sample mode: not saved)`)} />}
    </>
  );
}

export default function ClientsRoute() {
  return USE_SAMPLE_DATA ? <SampleClients /> : <LiveClients />;
}
