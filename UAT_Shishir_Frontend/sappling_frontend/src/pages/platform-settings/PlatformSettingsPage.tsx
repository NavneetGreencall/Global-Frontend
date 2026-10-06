import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Header, Sidebar, SAPLING_LOGO } from "@/layout";
import { SAMPLE_USER } from "@/sample-data/user";
import { SETTINGS } from "@/sample-data/platform-settings";
import type { ShellProps } from "@/layout";
import "./platform-settings.css";

/* =====================================================================
   Platform settings

   Three tabs, each made of cards. Every card lists its fields; the
   "Edit" button turns them into inputs, and "Save" calls onSave.

   The Workspace values come from your live page. Delivery setup and
   SLA & retention values are SAMPLE defaults (the 3-day SLA and 24-hour
   risk window match what the other pages use). Replace them with your
   real settings:  <PlatformSettings settings={...} onSave={...} />

   Field types: "text" | "select" | "number" | "toggle"
   ===================================================================== */

/* ---------- data types ---------- */

export type FieldValue = string | number | boolean;

/** One setting. "options" is for select fields; min/max/unit are for numbers. */
export interface SettingField {
  id: string;
  label: string;
  type: "text" | "select" | "number" | "toggle";
  value: FieldValue;
  options?: string[];
  unit?: string;
  min?: number;
  max?: number;
  hint?: string;
}

export interface SettingsCardData {
  id: string;
  title: string;
  subtitle: string;
  status?: "active";
  fields: SettingField[];
}

export type SettingsTab = "workspace" | "delivery" | "sla";
export type SettingsData = Record<SettingsTab, SettingsCardData[]>;
type Draft = Record<string, FieldValue>;


const TABS: { id: SettingsTab; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "delivery", label: "Delivery setup" },
  { id: "sla", label: "SLA & retention" },
];

/* ---------- icons ---------- */

const ICONS: Record<string, ReactNode> = {
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  shield: <><path d="M12 3.5l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z" /><path d="M9 12l2 2 4-4" /></>,
  down: <path d="M7 10l5 5 5-5" />,
};

const Icon = ({ name, size = 16 }: { name: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- how a value looks when not editing ---------- */

function showValue(field: SettingField) {
  if (field.type === "toggle") return field.value ? "On" : "Off";
  if (field.type === "number") return `${field.value} ${field.unit ?? ""}`.trim();
  return field.value;
}

/* ---------- one input, by field type ---------- */

function FieldInput({ field, value, onChange }: { field: SettingField; value: FieldValue; onChange: (value: FieldValue) => void }) {
  const id = `setting-${field.id}`;

  if (field.type === "toggle") {
    return (
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={Boolean(value)}
        className={`settings-toggle ${value ? "is-on" : ""}`}
        onClick={() => onChange(!value)}
      >
        <span className="settings-toggle-knob" />
        <span className="visually-hidden">{field.label}</span>
      </button>
    );
  }

  if (field.type === "select") {
    return (
      <span className="filter-select settings-select">
        <select id={id} value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <Icon name="down" />
      </span>
    );
  }

  if (field.type === "number") {
    return (
      <span className="settings-number">
        <input
          id={id}
          className="settings-input"
          type="number"
          min={field.min}
          max={field.max}
          value={value === "" ? "" : Number(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
        {field.unit && <span className="settings-unit">{field.unit}</span>}
      </span>
    );
  }

  return <input id={id} className="settings-input" type="text" value={String(value)} onChange={(e) => onChange(e.target.value)} />;
}

/* ---------- one settings card ---------- */

function SettingsCard({ card, onSave }: { card: SettingsCardData; onSave: (cardId: string, values: Draft) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const start = () => {
    setDraft(Object.fromEntries(card.fields.map((f) => [f.id, f.value])));
    setError("");
    setEditing(true);
  };

  const cancel = () => { setEditing(false); setError(""); };

  const save = async () => {
    // simple checks: text not empty, numbers inside their range
    for (const f of card.fields) {
      const v = draft[f.id];
      if (f.type === "text" && !String(v).trim()) return setError(`${f.label} can't be empty.`);
      if (f.type === "number" && (v === "" || Number(v) < (f.min ?? -Infinity) || Number(v) > (f.max ?? Infinity))) {
        return setError(`${f.label} must be between ${f.min} and ${f.max}.`);
      }
    }
    try {
      await onSave(card.id, draft);
      setEditing(false);
      setSaved(true);
    } catch (err) {
      // e.g. "not available" or 409 (changed by someone else): stay in edit mode and say why
      setError((err instanceof Error && err.message) || "Couldn't save. Please try again.");
    }
  };

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  const changed = editing && card.fields.some((f) => draft[f.id] !== f.value);

  return (
    <section className="settings-card" aria-labelledby={`card-${card.id}`}>
      <header className="settings-card-header">
        <div>
          <h2 id={`card-${card.id}`} className="settings-card-title">{card.title}</h2>
          <p className="settings-card-subtitle">{card.subtitle}</p>
        </div>
        {card.status === "active" && <span className="workspace-status"><i />Active</span>}
        {!editing && (
          <button className="settings-edit-button" onClick={start}>
            <Icon name="edit" size={14} /> Edit
          </button>
        )}
      </header>

      <dl className="settings-list">
        {card.fields.map((f) => (
          <div key={f.id} className="settings-row">
            <dt>
              {editing ? <label htmlFor={`setting-${f.id}`} className="settings-label">{f.label}</label> : <span className="settings-label">{f.label}</span>}
              {f.hint && <span className="settings-hint">{f.hint}</span>}
            </dt>
            <dd className="settings-value">
              {editing ? (
                <FieldInput field={f} value={draft[f.id]} onChange={(v) => setDraft((d) => ({ ...d, [f.id]: v }))} />
              ) : f.type === "toggle" ? (
                <span className={`settings-changed ${f.value ? "is-on" : ""}`}>{showValue(f)}</span>
              ) : (
                showValue(f)
              )}
            </dd>
          </div>
        ))}
      </dl>

      {editing && (
        <footer className="settings-actions">
          {error ? <span className="settings-error" role="alert">{error}</span> : <span className="audit-note"><Icon name="shield" size={13} /> Saving records this change in the audit trail.</span>}
          <button className="cancel-button" onClick={cancel}>Cancel</button>
          <button className="save-button" onClick={save} disabled={!changed}>Save changes</button>
        </footer>
      )}

      {saved && (
        <p className="settings-saved" role="status"><Icon name="check" size={14} /> Saved and recorded in the audit trail.</p>
      )}
    </section>
  );
}

/* ---------- page ---------- */

interface PlatformSettingsProps extends ShellProps {
  settings?: SettingsData;
  onSave?: (cardId: string, values: Record<string, FieldValue>) => void | Promise<void>;
}

export default function PlatformSettings({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  settings: initial = SETTINGS,
  user = SAMPLE_USER,
  onSave = (cardId: string, values: Draft) => console.log("save", cardId, values),
  onSearch = (q: string) => console.log("search", q),
}: PlatformSettingsProps) {
  const [menu, setMenu] = useState(false);
  const [tab, setTab] = useState<SettingsTab>("workspace");
  const [settings, setSettings] = useState<SettingsData>(initial);

  // Save through the callback, then show the new values on the page
  const handleSave = async (cardId: string, values: Draft) => {
    await onSave(cardId, values);
    setSettings((all) =>
      Object.fromEntries(
        (Object.entries(all) as [SettingsTab, SettingsCardData[]][]).map(([t, cards]) => [
          t,
          cards.map((c) => (c.id !== cardId ? c : { ...c, fields: c.fields.map((f) => ({ ...f, value: values[f.id] ?? f.value })) })),
        ])
      ) as SettingsData
    );
  };

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page settings-page">
          <header className="page-header settings-header">
            <div>
              <p className="page-eyebrow">Platform</p>
              <h1 className="page-title">Platform settings</h1>
              <p className="page-subtitle">Workspace, delivery and retention rules for the whole platform.</p>
            </div>
            <Link to="/admin/audit" className="audit-note audit-link">
              <Icon name="shield" size={14} /> Changes are recorded in the audit trail
            </Link>
          </header>

          <div className="settings-tabs" role="tablist" aria-label="Settings sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                className={`settings-tab ${tab === t.id ? "is-active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="settings-panel">
            {(settings[tab] ?? []).map((card) => (
              <SettingsCard key={card.id} card={card} onSave={handleSave} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
