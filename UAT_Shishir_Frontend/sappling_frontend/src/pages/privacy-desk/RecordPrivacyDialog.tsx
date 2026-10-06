import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { FormEvent } from "react";
import "@/components/ui/dialog.css";

/* =====================================================================
   "Record a data request" / "Record an incident" dialog.
   Only short references belong here: no identity documents, passwords
   or raw personal data.
   ===================================================================== */

export interface PrivacyFormValues {
  title: string;
  type: string; // request type (requests) or severity (incidents)
  subjectRef: string;
  dueDate: string; // yyyy-mm-dd, or "" for none
  description: string;
}

const REQUEST_TYPES: Record<string, string> = { access: "Access", correction: "Correction", erasure: "Erasure", objection: "Objection", portability: "Portability" };
const SEVERITIES: Record<string, string> = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const REFERENCE_MAX = 40;

interface Props {
  kind: "requests" | "incidents";
  onSubmit: (values: PrivacyFormValues) => Promise<void> | void;
  onClose: () => void;
}

export default function RecordPrivacyDialog({ kind, onSubmit, onClose }: Props) {
  const isRequest = kind === "requests";
  const options = isRequest ? REQUEST_TYPES : SEVERITIES;
  const [v, setV] = useState<PrivacyFormValues>({ title: "", type: isRequest ? "access" : "medium", subjectRef: "", dueDate: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof PrivacyFormValues) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [busy, onClose]);

  const today = new Date().toISOString().slice(0, 10);
  const ready = v.title.trim() !== "" && v.description.trim() !== "";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !ready) return;
    if (v.dueDate && v.dueDate < today) return setError("The review target date can't be in the past.");
    setBusy(true);
    setError("");
    try {
      await onSubmit({ ...v, title: v.title.trim(), subjectRef: v.subjectRef.trim(), description: v.description.trim() });
      onClose();
    } catch (err) {
      setError((err instanceof Error && err.message) || "Couldn't save the record. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Drawn straight into <body>, so the header and sidebar can never cover it
  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="privacy-dialog-title" style={{ maxWidth: 680 }}>
        <header className="dialog-header">
          <div>
            <h2 id="privacy-dialog-title" className="dialog-title">{isRequest ? "Record a data request" : "Record an incident"}</h2>
            <p className="dialog-subtitle">Use a short case or ticket reference. Do not paste identity documents, passwords or raw personal data.</p>
          </div>
          <button className="dialog-close" onClick={onClose} disabled={busy} aria-label="Close">×</button>
        </header>

        <form className="dialog-body" onSubmit={submit} noValidate>
          <div className="dialog-grid">
            <label className="dialog-field dialog-full">
              <span>Title</span>
              <input value={v.title} onChange={set("title")} maxLength={120} placeholder="Short description of the work" autoFocus />
            </label>

            <label className="dialog-field">
              <span>{isRequest ? "Request type" : "Severity"}</span>
              <select value={v.type} onChange={set("type")}>
                {Object.entries(options).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>

            <label className="dialog-field">
              <span>Subject / case reference</span>
              <input value={v.subjectRef} onChange={set("subjectRef")} maxLength={REFERENCE_MAX} placeholder="Case number or internal ticket" />
            </label>

            <label className="dialog-field">
              <span>Review target date (optional)</span>
              <input type="date" value={v.dueDate} min={today} onChange={set("dueDate")} />
            </label>

            <label className="dialog-field dialog-full">
              <span>Context for the reviewer</span>
              <textarea
                value={v.description}
                onChange={set("description")}
                maxLength={2000}
                placeholder={isRequest ? "Record the request and who should review it." : "Record the known incident facts and who should review them."}
              />
            </label>
          </div>

          <footer className="dialog-actions">
            {error && <span className="dialog-error" role="alert">{error}</span>}
            <button type="button" className="dialog-secondary" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="dialog-primary" disabled={busy || !ready} title={ready ? undefined : "Add a title and context first"}>
              {busy ? "Saving…" : "Create record"}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
