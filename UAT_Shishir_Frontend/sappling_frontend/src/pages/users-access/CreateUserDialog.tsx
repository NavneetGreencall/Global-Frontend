import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { createUser, getUserCreationPolicy, listRoles } from "@/lib/backend-api/users";
import { listClients } from "@/lib/backend-api/cases";
import { USE_SAMPLE_DATA } from "@/config/data-mode";
import { SAMPLE_CLIENTS, SAMPLE_POLICY } from "@/sample-data/create-user";
import "./create-user.css";

/* =====================================================================
   "Create user ID" dialog (live mode).

   - Roles and branches come from getUserCreationPolicy(): only what the
     signed-in admin may assign. The API checks every rule again.
   - Client Admins also need a client (from listClients()).
   - The temporary password is shown once after creation, to share
     securely; the person must change it at first sign-in.
   ===================================================================== */

/** Short explanations shown under each role (by role code) */
const ROLE_HELP: Record<string, string> = {
  PLATFORM_ADMIN: "Platform oversight, policy, access, audit and cross-workspace risk.",
  OPERATIONS_MANAGER: "Owns delivery, allocation, exceptions and SLA recovery.",
  VERIFIER: "Executes assigned checks, findings and source verification.",
  QA_REVIEWER: "Reviews evidence, returns rework and releases approved reports.",
  CLIENT_ADMIN: "Raises client-scoped cases and resolves requested actions.",
  FIELD_EXECUTIVE: "Completes assigned visits with GPS and integrity-checked evidence.",
  SALES_MANAGER: "Owns opportunities, activities and client onboarding pipeline.",
  FINANCE_MANAGER: "Manages invoicing, collections, credits and receivables.",
};

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MIN_PASSWORD = 12; // adjust to the backend's password rule
const ALL_BRANCHES = "__all__";

/** Names used when the role list from the API doesn't include a role */
const ROLE_NAMES: Record<string, string> = {
  PLATFORM_ADMIN: "Platform Admin", OPERATIONS_MANAGER: "Operations Manager", VERIFIER: "Verifier",
  QA_REVIEWER: "QA Reviewer", CLIENT_ADMIN: "Client Admin", FIELD_EXECUTIVE: "Field Executive",
  SALES_MANAGER: "Sales Manager", FINANCE_MANAGER: "Finance Manager",
};

const labelOf = (code: string) =>
  ROLE_NAMES[code] ?? code.split(/[_\s-]+/).filter(Boolean).map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");

/** A random temporary password: letters, digits and symbols, no look-alikes */
export function generatePassword(length = 16) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*?";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateUserDialog({ onClose, onCreated }: Props) {
  const policy = useQuery({
    queryKey: ["users", "creation-policy", USE_SAMPLE_DATA],
    queryFn: USE_SAMPLE_DATA ? async () => SAMPLE_POLICY : getUserCreationPolicy,
  });
  const roles = useQuery({ queryKey: ["users", "roles"], queryFn: listRoles, staleTime: 10 * 60_000, enabled: !USE_SAMPLE_DATA });

  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [client, setClient] = useState("");
  const [password, setPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);

  const needsClient = role === "CLIENT_ADMIN";
  const clients = useQuery({
    queryKey: ["clients", "options", USE_SAMPLE_DATA],
    queryFn: USE_SAMPLE_DATA ? async () => SAMPLE_CLIENTS : () => listClients({ limit: 100 }),
    enabled: needsClient,
  });

  const firstField = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [busy, onClose]);

  const roleName = (code: string) => roles.data?.items.find((r) => r.code === code)?.name ?? labelOf(code);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!role) return setError("Select one primary role.");
    if (!name.trim()) return setError("Enter the person's full name.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid work email.");
    const digits = phone.replace(/\D/g, "");
    if (phone.trim() && !(digits.length === 10 || (digits.length === 12 && digits.startsWith("91"))))
      return setError("Enter a 10-digit Indian mobile number, or leave it empty.");
    if (needsClient && !client) return setError("Choose the client this Client Admin belongs to.");
    if (!needsClient && !branch) return setError("Choose a branch scope.");
    if (password.length < MIN_PASSWORD) return setError(`The temporary password needs at least ${MIN_PASSWORD} characters.`);

    setBusy(true);
    setError("");
    try {
      if (USE_SAMPLE_DATA) {
        await pause(600); // sample mode: nothing is sent anywhere
        setCreated({ name: name.trim(), email: email.trim(), password });
        onCreated();
        return;
      }
      await createUser({
        email: email.trim(),
        displayName: name.trim(),
        phone: phone.trim() || undefined,
        roleCodes: [role],
        branchId: !needsClient && branch !== ALL_BRANCHES ? branch : undefined,
        clientId: needsClient ? client : undefined,
        temporaryPassword: password,
      });
      setCreated({ name: name.trim(), email: email.trim(), password });
      onCreated();
    } catch (err) {
      setError((err instanceof Error && err.message) || "Couldn't create the user. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const p = policy.data;

  // Drawn straight into <body>, so the header and sidebar can never cover it
  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
        <header className="dialog-header">
          <div>
            <h2 id="create-user-title" className="dialog-title">{created ? "User ID created" : "Create user ID"}</h2>
            <p className="dialog-subtitle">
              {created ? "Share the temporary password securely. It is shown only once." : "Assign only the role and server-validated scope this person needs."}
            </p>
          </div>
          <button className="dialog-close" onClick={onClose} disabled={busy} aria-label="Close">×</button>
        </header>

        {created ? (
          <div className="dialog-body">
            <dl className="created-summary">
              <div><dt>Name</dt><dd>{created.name}</dd></div>
              <div><dt>Sign-in email</dt><dd>{created.email}</dd></div>
              <div><dt>Temporary password</dt><dd className="created-password">{created.password}</dd></div>
            </dl>
            <p className="dialog-hint">
              {USE_SAMPLE_DATA ? "Sample mode: nothing was saved. With the real API this creates the account." : "They'll be asked to choose a new password at first sign-in."}
            </p>
            <footer className="dialog-actions">
              <button className="dialog-secondary" onClick={() => navigator.clipboard?.writeText(created.password)}>Copy password</button>
              <button className="dialog-primary" onClick={onClose}>Done</button>
            </footer>
          </div>
        ) : policy.isPending ? (
          <div className="dialog-body"><p className="dialog-hint">Loading what you're allowed to assign…</p></div>
        ) : policy.isError || !p ? (
          <div className="dialog-body"><p className="dialog-error">Couldn't load the creation policy. Close and try again.</p></div>
        ) : !p.enabled ? (
          <div className="dialog-body"><p className="dialog-error">Your account isn't allowed to create user IDs.</p></div>
        ) : (
          <form className="dialog-body" onSubmit={submit} noValidate>
            <section className="dialog-section" ref={firstField}>
              <div className="dialog-section-head">
                <div>
                  <h3>Primary role</h3>
                  <p>This decides the person's home workspace and normal access.</p>
                </div>
                <span className="dialog-required">Required</span>
              </div>
              <div className="role-options" role="radiogroup" aria-label="Primary role">
                {p.roles.map((code) => (
                  <label key={code} className={`role-option ${role === code ? "is-selected" : ""}`}>
                    <input type="radio" name="role" value={code} checked={role === code} onChange={() => { setRole(code); setError(""); }} />
                    <span>
                      <strong>{roleName(code)}</strong>
                      <small>{ROLE_HELP[code] ?? ""}</small>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="dialog-section dialog-grid">
              <label className="dialog-field">
                <span>Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rohan Iyer" maxLength={120} autoComplete="off" />
              </label>
              <label className="dialog-field">
                <span>Work email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rohan@saplingglobal.in" autoComplete="off" />
              </label>
              <label className="dialog-field">
                <span>Mobile (optional)</span>
                <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
              </label>
              {needsClient ? (
                <label className="dialog-field">
                  <span>Client</span>
                  <select value={client} onChange={(e) => setClient(e.target.value)}>
                    <option value="">{clients.isPending ? "Loading clients…" : "Choose a client"}</option>
                    {clients.data?.items.map((c) => <option key={c.publicId} value={c.publicId}>{c.displayName}</option>)}
                  </select>
                </label>
              ) : (
                <label className="dialog-field">
                  <span>Branch scope</span>
                  <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option value="">Choose a branch</option>
                    {p.tenantWideAllowed && <option value={ALL_BRANCHES}>All branches</option>}
                    {p.branches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.city ? `, ${b.city}` : ""}</option>)}
                  </select>
                </label>
              )}
            </section>

            <section className="dialog-section">
              <label className="dialog-field">
                <span>Temporary password</span>
                <div className="password-row">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" className="dialog-secondary" onClick={() => setShowPassword((s) => !s)}>{showPassword ? "Hide" : "Show"}</button>
                  <button type="button" className="dialog-secondary" onClick={() => { setPassword(generatePassword()); setShowPassword(true); }}>Generate</button>
                </div>
                <small className="dialog-hint">At least {MIN_PASSWORD} characters. They must change it at first sign-in.</small>
              </label>
            </section>

            <footer className="dialog-actions">
              {error && <span className="dialog-error" role="alert">{error}</span>}
              <button type="button" className="dialog-secondary" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="submit" className="dialog-primary" disabled={busy}>{busy ? "Creating…" : "Create user ID"}</button>
            </footer>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
