import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Header, Sidebar, SAPLING_LOGO } from "@/layout";
import { SAMPLE_USER } from "@/sample-data/user";
import { TOTALS, RECEIVABLES } from "@/sample-data/finance-billing";
import { Pagination, usePagination } from "@/components/ui";
import type { ShellProps } from "@/layout";
import "./finance-billing.css";

/* =====================================================================
   Finance & billing oversight

   Numbers come from your live page. Pass real data with:
     <FinanceBilling totals={...} receivables={...} snapshotAt="..." />

   receivables: open invoices, e.g.
     { id: "INV-104", client: "Acme India", amount: 12000, daysOutstanding: 42 }
   daysOutstanding decides which age bucket an invoice falls into.
   ===================================================================== */

/* ---------- data types ---------- */

export interface FinanceTotals {
  billed: number;
  invoices: number;
  collected: number;
  outstanding: number;
  openInvoices: number;
  overdue: number;
  overdueInvoices: number;
}

/** One open invoice. daysOutstanding decides its age bucket. */
export interface Receivable {
  id: string;
  client: string;
  amount: number;
  daysOutstanding: number;
}

interface Bucket {
  id: string;
  label: string;
  min: number;
  max: number;
  color: string;
}

// Collection-age buckets, in order
const BUCKETS: Bucket[] = [
  { id: "current", label: "0 to 30 days", min: 0, max: 30, color: "#22a65a" },
  { id: "d31", label: "31 to 60 days", min: 31, max: 60, color: "#e0a015" },
  { id: "d61", label: "61 to 90 days", min: 61, max: 90, color: "#f08a24" },
  { id: "d90", label: "Over 90 days", min: 91, max: Infinity, color: "#c0392b" },
];

/* ---------- helpers ---------- */

const money = (n: number) =>
  "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatSnapshot = (d: Date | string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
  });

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/* ---------- icons ---------- */

const ICONS: Record<string, ReactNode> = {
  receipt: <><path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 11.5h6M9 15h3" /></>,
  bank: <><path d="M3.5 9L12 4l8.5 5" /><path d="M5 9.5v8M9.5 9.5v8M14.5 9.5v8M19 9.5v8M3.5 20h17" /></>,
  inbox: <><path d="M4 13l2.5-7h11L20 13v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" /><path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20" /></>,
  alert: <><path d="M10.3 4.2L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" /><path d="M12 9.5v4M12 17h.01" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

const Icon = ({ name, size = 16 }: { name: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- receivables exposure ---------- */

function ReceivablesExposure({ receivables }: { receivables: Receivable[] }) {
  const oldestFirst = [...receivables].sort((a, b) => b.daysOutstanding - a.daysOutstanding);
  const paged = usePagination(oldestFirst, 10);
  const buckets = BUCKETS.map((b) => {
    const items = receivables.filter((r) => r.daysOutstanding >= b.min && r.daysOutstanding <= b.max);
    return { ...b, count: items.length, amount: items.reduce((s, r) => s + r.amount, 0) };
  });
  const largest = Math.max(1, ...buckets.map((b) => b.amount));

  return (
    <section className="finance-panel" aria-labelledby="exposure-title">
      <header className="finance-panel-header">
        <div>
          <h2 id="exposure-title" className="finance-panel-title">Receivables exposure</h2>
          <p className="finance-panel-subtitle">Outstanding value by collection age. No payment controls are exposed here.</p>
        </div>
      </header>

      {/* Age buckets, always shown so the empty state still explains the view */}
      <div className="aging-buckets">
        {buckets.map((b) => (
          <div key={b.id} className="aging-bucket">
            <span className="aging-label"><i style={{ background: b.color }} />{b.label}</span>
            <strong className="aging-amount">{money(b.amount)}</strong>
            <span className="aging-count">{plural(b.count, "invoice")}</span>
            <span className="aging-bar" aria-hidden="true">
              <span style={{ width: `${(b.amount / largest) * 100}%`, background: b.color }} />
            </span>
          </div>
        ))}
      </div>

      {receivables.length === 0 ? (
        <div className="finance-empty">
          <span className="empty-icon"><Icon name="check" size={22} /></span>
          <strong>No outstanding receivables</strong>
          <p>Every invoice raised has been collected in full.</p>
        </div>
      ) : (
        <ul className="receivable-list">
          {paged.items.map((r) => (
            <li key={r.id} className="receivable-row">
              <div className="receivable-client">
                <strong>{r.client}</strong>
                <span>{r.id}</span>
              </div>
              <span className={`receivable-due ${r.daysOutstanding > 60 ? "receivable-due-late" : ""}`}>
                {r.daysOutstanding} days outstanding
              </span>
              <strong className="receivable-amount">{money(r.amount)}</strong>
            </li>
          ))}
        </ul>
      )}
      {receivables.length > 0 && (
        <Pagination {...paged.props} itemLabel="invoices" />
      )}
    </section>
  );
}

/* ---------- collection progress ---------- */

function CollectionProgress({ totals }: { totals: FinanceTotals }) {
  const rate = totals.billed ? Math.round((totals.collected / totals.billed) * 100) : 0;
  return (
    <section className="finance-panel" aria-labelledby="collection-title">
      <header className="finance-panel-header">
        <div>
          <h2 id="collection-title" className="finance-panel-title">Collection progress</h2>
          <p className="finance-panel-subtitle">How much of what was billed has been received.</p>
        </div>
      </header>

      <div className="collection-meter">
        <strong>{rate}%</strong>
        <span>realised</span>
      </div>
      <div className="collection-track" role="img" aria-label={`${rate}% of billed value collected`}>
        <span className="collection-fill" style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>

      <dl className="collection-figures">
        <div className="collection-figure">
          <dt>Billed</dt>
          <dd>{money(totals.billed)}</dd>
        </div>
        <div className="collection-figure">
          <dt>Collected</dt>
          <dd>{money(totals.collected)}</dd>
        </div>
        <div className="collection-figure">
          <dt>Still to collect</dt>
          <dd>{money(totals.outstanding)}</dd>
        </div>
      </dl>

      <Link to="/admin/sales" className="action-button">
        Open Sales &amp; CRM <Icon name="arrow" size={14} />
      </Link>
    </section>
  );
}

/* ---------- page ---------- */

interface FinanceBillingProps extends ShellProps {
  totals?: FinanceTotals;
  receivables?: Receivable[];
  snapshotAt?: Date | string;
  onStatement?: () => void;
}

export default function FinanceBilling({
  logoSrc = SAPLING_LOGO,
  orgName = "Sapling Global",
  totals = TOTALS,
  receivables = RECEIVABLES,
  snapshotAt = new Date(),
  user = SAMPLE_USER,
  onStatement = () => console.log("monthly statement"),
  onSearch = (q: string) => console.log("search", q),
}: FinanceBillingProps) {
  const [menu, setMenu] = useState(false);
  const rate = totals.billed ? Math.round((totals.collected / totals.billed) * 100) : 0;

  const summary = [
    { icon: "receipt", label: "Billed", value: money(totals.billed), note: plural(totals.invoices, "invoice") },
    { icon: "bank", label: "Collected", value: money(totals.collected), note: `${rate}% realised` },
    { icon: "inbox", label: "Outstanding", value: money(totals.outstanding), note: `${plural(totals.openInvoices, "open invoice")}` },
    { icon: "alert", label: "Overdue", value: money(totals.overdue), note: `${totals.overdueInvoices} beyond due date`, alert: totals.overdue > 0 },
  ];

  return (
    <div className="app">
      <Sidebar logoSrc={logoSrc} orgName={orgName} user={user} open={menu} onClose={() => setMenu(false)} />
      <div className="app-main">
        <Header onMenu={() => setMenu(true)} onSearch={onSearch} />

        <main className="page finance-page">
          <header className="page-header finance-header">
            <div>
              <p className="page-eyebrow">Stakeholders</p>
              <h1 className="page-title">Finance &amp; billing oversight</h1>
              <p className="page-subtitle finance-snapshot">
                <Icon name="calendar" size={13} /> Snapshot generated {formatSnapshot(snapshotAt)}
              </p>
            </div>
            <button className="statement-button" onClick={onStatement}>
              <Icon name="calendar" size={15} /> Monthly statement
            </button>
          </header>

          <div className="summary-cards">
            {summary.map((s) => (
              <div key={s.label} className={`summary-card ${s.alert ? "summary-card-alert" : ""}`}>
                <div className="summary-card-top">
                  <span className="summary-card-label">{s.label}</span>
                  <span className="summary-card-icon"><Icon name={s.icon} /></span>
                </div>
                <strong className="summary-card-value">{s.value}</strong>
                <span className="summary-card-note">{s.note}</span>
              </div>
            ))}
          </div>

          <div className="finance-grid">
            <ReceivablesExposure receivables={receivables} />
            <CollectionProgress totals={totals} />
          </div>
        </main>
      </div>
    </div>
  );
}
