import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/backend-api/cases";
import { USE_SAMPLE_DATA } from "@/config/data-mode";
import "@/components/ui/dialog.css";

/* =====================================================================
   "Onboard a client" dialog.
   Creates a client workspace with its SLA commitment and primary contact
   through createClient(). The API also needs a short client code; this
   form makes one from the company name (e.g. "MFS-4K7Q").
   ===================================================================== */

const MAX_SLA_DAYS = 60;

/** "Meridian Financial Services" → "MFS-4K7Q" (initials + 4 random characters) */
export function makeClientCode(name: string) {
  const initials = name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4) || "CL";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  return `${initials}-${Array.from(bytes, (b) => chars[b % chars.length]).join("")}`;
}

interface Props {
  onClose: () => void;
  onCreated: (name: string) => void;
}

export default function OnboardClientDialog({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [slaDays, setSlaDays] = useState("5");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [busy, onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const days = Number(slaDays);
    if (!name.trim()) return setError("Enter the company name.");
    if (!Number.isInteger(days) || days < 1 || days > MAX_SLA_DAYS) return setError(`SLA commitment must be a whole number of days from 1 to ${MAX_SLA_DAYS}.`);
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid contact email, or leave it empty.");

    setBusy(true);
    setError("");
    try {
      if (USE_SAMPLE_DATA) {
        await new Promise((r) => setTimeout(r, 500)); // sample mode: nothing is sent anywhere
      } else {
        await createClient({
          code: makeClientCode(name),
          legalName: name.trim(),
          displayName: name.trim(),
          contactName: contact.trim() || undefined,
          contactEmail: email.trim() || undefined,
          slaHours: days * 24,
        });
      }
      onCreated(name.trim());
      onClose();
    } catch (err) {
      setError((err instanceof Error && err.message) || "Couldn't create the client. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Drawn straight into <body>, so the header and sidebar can never cover it
  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="onboard-title" style={{ maxWidth: 520 }}>
        <header className="dialog-header">
          <div>
            <h2 id="onboard-title" className="dialog-title">Onboard a client</h2>
            <p className="dialog-subtitle">Creates a client workspace with its SLA commitment and primary contact.</p>
          </div>
          <button className="dialog-close" onClick={onClose} disabled={busy} aria-label="Close">×</button>
        </header>

        <form className="dialog-body" onSubmit={submit} noValidate>
          <div className="dialog-grid">
            <label className="dialog-field dialog-full">
              <span>Company name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Meridian Financial Services" autoFocus />
            </label>
            <label className="dialog-field">
              <span>SLA commitment (days)</span>
              <input type="number" inputMode="numeric" min={1} max={MAX_SLA_DAYS} value={slaDays} onChange={(e) => setSlaDays(e.target.value)} />
            </label>
            <label className="dialog-field">
              <span>Primary contact</span>
              <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} placeholder="Ananya Rao" />
            </label>
            <label className="dialog-field dialog-full">
              <span>Contact email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ananya.rao@company.in" />
            </label>
          </div>

          <footer className="dialog-actions">
            {error && <span className="dialog-error" role="alert">{error}</span>}
            <button type="button" className="dialog-secondary" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="dialog-primary" disabled={busy}>{busy ? "Creating…" : "Create client"}</button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
