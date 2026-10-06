import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { listUsers } from "@/lib/backend-api/users";
import type { DirectoryUser } from "@/lib/backend-api/users";
import { assignCaseOwner } from "@/api/operations";
import { USE_SAMPLE_DATA } from "@/config/data-mode";
import { SAMPLE_PEOPLE } from "@/sample-data/assign-owner";
import "@/components/ui/dialog.css";
import "./assign-owner.css";

/* =====================================================================
   "Assign owner" dialog: pick an active user and make them the owner of
   one or more cases, through PATCH /cases/:caseId/owner.
   Used by the Cases register (row or bulk) and the Control Tower.
   ===================================================================== */

/** A case to assign: id is the API's case id, caseNumber what people see */
export interface CaseRef {
  id: string;
  caseNumber: string;
}

type Person = Pick<DirectoryUser, "id" | "displayName" | "email" | "roles">;


const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

/** Assign every case to one person; returns the cases that failed, with the reason */
export async function assignCases(cases: CaseRef[], ownerUserId: string) {
  const failed: { caseNumber: string; reason: string }[] = [];
  for (const c of cases) {
    try {
      if (USE_SAMPLE_DATA) await new Promise((r) => setTimeout(r, 150));
      else await assignCaseOwner(c.id, ownerUserId);
    } catch (err) {
      failed.push({ caseNumber: c.caseNumber, reason: messageOf(err) });
    }
  }
  return failed;
}

/** "Assign to me": finds the signed-in person's user record by email */
export async function findUserByEmail(email: string): Promise<Person | null> {
  if (USE_SAMPLE_DATA) return SAMPLE_PEOPLE[2];
  const res = await listUsers({ search: email, status: "ACTIVE", pageSize: 10 });
  return res.items.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

interface Props {
  cases: CaseRef[];
  onClose: () => void;
  /** called after any assignment went through, so lists can reload */
  onAssigned: () => void;
}

export default function AssignOwnerDialog({ cases, onClose, onAssigned }: Props) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Person | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState<{ caseNumber: string; reason: string }[]>([]);
  const term = useDebounced(search.trim());

  const people = useQuery({
    queryKey: ["users", "assignable", term, USE_SAMPLE_DATA],
    queryFn: async () => {
      if (USE_SAMPLE_DATA) {
        const q = term.toLowerCase();
        return SAMPLE_PEOPLE.filter((p) => !q || `${p.displayName} ${p.email}`.toLowerCase().includes(q));
      }
      return (await listUsers({ search: term || undefined, status: "ACTIVE", pageSize: 20 })).items;
    },
  });

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [busy, onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!picked) return setError("Choose who should own the case.");
    setBusy(true);
    setError("");
    const problems = await assignCases(cases, picked.id);
    setBusy(false);
    if (problems.length < cases.length) onAssigned();
    if (problems.length === 0) return onClose();
    setFailed(problems);
    setError(problems.length === cases.length ? "None of the cases could be assigned." : `${cases.length - problems.length} assigned, ${problems.length} could not be.`);
  };

  const title = cases.length === 1 ? `Assign owner: ${cases[0].caseNumber}` : `Assign owner to ${cases.length} cases`;

  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="assign-title" style={{ maxWidth: 560 }}>
        <header className="dialog-header">
          <div>
            <h2 id="assign-title" className="dialog-title">{title}</h2>
            <p className="dialog-subtitle">The owner leads the case and is responsible for its next action.</p>
          </div>
          <button className="dialog-close" onClick={onClose} disabled={busy} aria-label="Close">×</button>
        </header>

        <form className="dialog-body" onSubmit={submit} noValidate>
          <label className="dialog-field">
            <span>Find a person</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" autoFocus />
          </label>

          <div className="assign-people" role="radiogroup" aria-label="People">
            {people.isPending && <p className="dialog-hint">Loading people…</p>}
            {people.isError && <p className="dialog-error">Couldn't load people: {messageOf(people.error)}</p>}
            {people.data?.length === 0 && <p className="dialog-hint">No active person matches “{term}”.</p>}
            {people.data?.map((p) => (
              <label key={p.id} className={`assign-person ${picked?.id === p.id ? "is-selected" : ""}`}>
                <input type="radio" name="owner" checked={picked?.id === p.id} onChange={() => { setPicked(p); setError(""); }} />
                <span className="assign-avatar" aria-hidden="true">{p.displayName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                <span className="assign-who">
                  <strong>{p.displayName}</strong>
                  <small>{p.email}{p.roles[0] ? ` · ${p.roles[0].name}` : ""}</small>
                </span>
              </label>
            ))}
          </div>

          {failed.length > 0 && (
            <ul className="assign-failed">
              {failed.map((f) => <li key={f.caseNumber}><strong>{f.caseNumber}</strong>: {f.reason}</li>)}
            </ul>
          )}

          <footer className="dialog-actions">
            {error && <span className="dialog-error" role="alert">{error}</span>}
            <button type="button" className="dialog-secondary" onClick={onClose} disabled={busy}>{failed.length ? "Close" : "Cancel"}</button>
            <button type="submit" className="dialog-primary" disabled={busy || !picked}>
              {busy ? "Assigning…" : picked ? `Assign to ${picked.displayName.split(" ")[0]}` : "Assign"}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
