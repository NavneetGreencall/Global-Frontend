import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import "./dialog.css";
import "./feedback.css";

/* =====================================================================
   Feedback: confirm dialogs, text prompts and toasts for the whole app,
   instead of the browser's window.confirm / prompt / alert.

     const { confirm, prompt, toast } = useFeedback();
     if (await confirm({ title: "Suspend Rohan?", danger: true, confirmLabel: "Suspend" })) …
     const value = await prompt({ title: "Temporary password", minLength: 12, generate: makePassword });
     toast("User suspended");            // success (default)
     toast("Couldn't save", "error");    // error
   ===================================================================== */

type Tone = "success" | "error" | "info";

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** red confirm button, for actions like Suspend or Pause */
  danger?: boolean;
}

export interface PromptOptions {
  title: string;
  message?: ReactNode;
  label: string;
  confirmLabel?: string;
  minLength?: number;
  /** shows a "Generate" button that fills the field */
  generate?: () => string;
  /** show the value as dots, with a Show button */
  secret?: boolean;
}

interface FeedbackApi {
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  prompt: (o: PromptOptions) => Promise<string | null>;
  toast: (message: string, tone?: Tone) => void;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const api = useContext(FeedbackContext);
  if (!api) throw new Error("useFeedback must be used inside <FeedbackProvider>");
  return api;
}

type Request =
  | { kind: "confirm"; options: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: "prompt"; options: PromptOptions; resolve: (v: string | null) => void };

interface ToastItem { id: number; message: string; tone: Tone }

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setRequest({ kind: "confirm", options, resolve })), []);
  const prompt = useCallback((options: PromptOptions) => new Promise<string | null>((resolve) => setRequest({ kind: "prompt", options, resolve })), []);
  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const toast = useCallback((message: string, tone: Tone = "success") => {
    const id = nextId.current++;
    setToasts((all) => [...all.slice(-3), { id, message, tone }]); // at most 4 on screen
    setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4000);
  }, [dismiss]);

  const close = (value: boolean | string | null) => {
    if (!request) return;
    if (request.kind === "confirm") request.resolve(Boolean(value));
    else request.resolve(typeof value === "string" ? value : null);
    setRequest(null);
  };

  return (
    <FeedbackContext.Provider value={{ confirm, prompt, toast }}>
      {children}
      {request?.kind === "confirm" && <ConfirmDialog options={request.options} onClose={close} />}
      {request?.kind === "prompt" && <PromptDialog options={request.options} onClose={close} />}
      {createPortal(
        <div className="toast-stack" aria-live="polite" aria-atomic="false">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.tone}`} role={t.tone === "error" ? "alert" : "status"}>
              <span className="toast-mark" aria-hidden="true">{t.tone === "success" ? "✓" : t.tone === "error" ? "!" : "i"}</span>
              <span className="toast-text">{t.message}</span>
              <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">×</button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </FeedbackContext.Provider>
  );
}

/* ---------- the two dialogs ---------- */

function useEscape(onEscape: () => void) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onEscape();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onEscape]);
}

function ConfirmDialog({ options, onClose }: { options: ConfirmOptions; onClose: (v: boolean) => void }) {
  const cancel = useCallback(() => onClose(false), [onClose]);
  useEscape(cancel);
  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && cancel()}>
      <div className="dialog feedback-dialog" role="alertdialog" aria-modal="true" aria-labelledby="fb-title">
        <header className="dialog-header">
          <div>
            <h2 id="fb-title" className="dialog-title">{options.title}</h2>
            {options.message && <p className="dialog-subtitle">{options.message}</p>}
          </div>
        </header>
        <footer className="dialog-actions feedback-actions">
          <button className="dialog-secondary" onClick={cancel}>{options.cancelLabel ?? "Cancel"}</button>
          <button className={`dialog-primary ${options.danger ? "is-danger" : ""}`} onClick={() => onClose(true)} autoFocus>
            {options.confirmLabel ?? "Confirm"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

function PromptDialog({ options, onClose }: { options: PromptOptions; onClose: (v: string | null) => void }) {
  const [value, setValue] = useState(() => options.generate?.() ?? "");
  const [show, setShow] = useState(!options.secret);
  const [error, setError] = useState("");
  const cancel = useCallback(() => onClose(null), [onClose]);
  useEscape(cancel);
  const submit = () => {
    if (options.minLength && value.length < options.minLength) return setError(`Use at least ${options.minLength} characters.`);
    onClose(value);
  };
  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && cancel()}>
      <div className="dialog feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="fb-title">
        <header className="dialog-header">
          <div>
            <h2 id="fb-title" className="dialog-title">{options.title}</h2>
            {options.message && <p className="dialog-subtitle">{options.message}</p>}
          </div>
          <button className="dialog-close" onClick={cancel} aria-label="Close">×</button>
        </header>
        <form className="dialog-body" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
          <label className="dialog-field">
            <span>{options.label}</span>
            <span className="feedback-input-row">
              <input type={show ? "text" : "password"} value={value} onChange={(e) => { setValue(e.target.value); setError(""); }} autoFocus />
              {options.secret && <button type="button" className="dialog-secondary" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>}
              {options.generate && <button type="button" className="dialog-secondary" onClick={() => { setValue(options.generate!()); setShow(true); }}>Generate</button>}
              <button type="button" className="dialog-secondary" onClick={() => navigator.clipboard?.writeText(value)}>Copy</button>
            </span>
            {options.minLength && <small className="dialog-hint">At least {options.minLength} characters.</small>}
          </label>
          <footer className="dialog-actions">
            {error && <span className="dialog-error" role="alert">{error}</span>}
            <button type="button" className="dialog-secondary" onClick={cancel}>Cancel</button>
            <button type="submit" className="dialog-primary">{options.confirmLabel ?? "Save"}</button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
