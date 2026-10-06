import { lazy, useEffect } from "react";
import type { ComponentType } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { SAPLING_LOGO } from "@/layout";
import { RequireAuth, SessionLayout } from "@/auth/session";
import LoginPage from "@/auth/LoginPage";

/*
  Routing for the Sapling Global admin.

  Setup (once):
    npm install react-router-dom

  Then render <App /> from your entry file (main.jsx or index.js):
    import App from "./App";
    createRoot(document.getElementById("root")).render(<App />);

  Pages live in src/pages/<page>/, the app shell in src/layout/, shared UI in
  src/components/ui/ and shared styles in src/styles/ (see README.md).

  All /admin pages share one <AppLayout>, so the sidebar and header stay on
  screen while you move between pages (no reload, no flash).
*/

const pages = {
  ControlTower: () => import("./pages/control-tower/ControlTowerRoute"), // page + API connection
  ExecutiveAnalytics: () => import("./pages/executive-analytics/ExecutiveAnalyticsRoute"), // page + API connection
  SalesCRM: () => import("./pages/sales-crm/SalesCrmRoute"), // page + API connection
  CasesRegister: () => import("./pages/cases/CasesRoute"), // page + API connection
  VerifierOperations: () => import("./pages/verifier-operations/VerifierOperationsRoute"), // page + API connection
  QAReview: () => import("./pages/qa-review/QaReviewRoute"), // page + API connection
  Exceptions: () => import("./pages/exceptions/ExceptionsRoute"), // page + API connection
  FieldOperations: () => import("./pages/field-operations/FieldOperationsRoute"), // page + API connection
  ReleasedReports: () => import("./pages/released-reports/ReleasedReportsRoute"), // page + API connection
  Clients: () => import("./pages/clients/ClientsRoute"), // page + API connection
  ClientPortfolio: () => import("./pages/client-portfolio/ClientPortfolioRoute"), // page + API connection
  FinanceBilling: () => import("./pages/finance-billing/FinanceBillingRoute"), // page + API connection
  UsersAccess: () => import("./pages/users-access/UsersAccessRoute"), // page + API connection
  PlatformSettings: () => import("./pages/platform-settings/PlatformSettingsRoute"), // page + API connection
  AuditTrail: () => import("./pages/audit-trail/AuditTrailRoute"), // page + API connection
  AccountSecurity: () => import("./pages/account-security/AccountSecurityRoute"), // page + API connection
  PrivacyDesk: () => import("./pages/privacy-desk/PrivacyDeskRoute"), // page + API connection
};

// Loads a page and gives a clear error if the file has no default export
const lazyPage = (name: keyof typeof pages) =>
  lazy(() =>
    pages[name]().then((m: { default: unknown }) => {
      if (typeof m.default !== "function") {
        throw new Error(`${name}.jsx has no "export default" component. Check that the file is saved and contains the page code.`);
      }
      return m as { default: ComponentType };
    })
  );

const ControlTower = lazyPage("ControlTower");
const ExecutiveAnalytics = lazyPage("ExecutiveAnalytics");
const SalesCRM = lazyPage("SalesCRM");
const CasesRegister = lazyPage("CasesRegister");
const VerifierOperations = lazyPage("VerifierOperations");
const QAReview = lazyPage("QAReview");
const Exceptions = lazyPage("Exceptions");
const FieldOperations = lazyPage("FieldOperations");
const ReleasedReports = lazyPage("ReleasedReports");
const Clients = lazyPage("Clients");
const ClientPortfolio = lazyPage("ClientPortfolio");
const FinanceBilling = lazyPage("FinanceBilling");
const UsersAccess = lazyPage("UsersAccess");
const PlatformSettings = lazyPage("PlatformSettings");
const AuditTrail = lazyPage("AuditTrail");
const AccountSecurity = lazyPage("AccountSecurity");
const PrivacyDesk = lazyPage("PrivacyDesk");

// Connect your existing pages the same way, e.g.
// e.g. const PrivacyDesk = lazyPage("PrivacyDesk"); after adding it to the pages list

// Download the other pages quietly after the first screen has loaded,
// so switching pages is instant.
function usePreloadPages() {
  useEffect(() => {
    const load = () => Object.values(pages).forEach((fn) => fn());
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(load);
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(load, 1500);
    return () => clearTimeout(id);
  }, []);
}

/* ---------------------------------------------------------------------
   Simple pages shown inside the layout
   --------------------------------------------------------------------- */

interface MessageProps {
  title: string;
  message: string;
  actionLabel: string;
}

function Message({ title, message, actionLabel }: MessageProps) {
  return (
    <main className="page">
      <section className="card" style={{ padding: "48px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <img src={SAPLING_LOGO} alt="" width={52} height={52} style={{ borderRadius: "50%" }} />
        <h1 style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>{title}</h1>
        <p style={{ margin: 0, color: "var(--ink-3)", maxWidth: 440 }}>{message}</p>
        <Link className="button-primary" to="/admin" style={{ display: "inline-flex", alignItems: "center", marginTop: 8 }}>{actionLabel}</Link>
      </section>
    </main>
  );
}

const Placeholder = ({ title }: { title: string }) => (
  <Message
    title={title}
    message="This section keeps working in your existing app. Connect its page component in App.jsx to show it here."
    actionLabel="Back to Control Tower"
  />
);

const NotFound = () => (
  <Message title="Page not found" message="The page you're looking for doesn't exist or has moved." actionLabel="Go to Control Tower" />
);

/* ---------------------------------------------------------------------
   Routes
   --------------------------------------------------------------------- */

export default function App() {
  usePreloadPages();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        <Route path="/auth" element={<LoginPage />} />

        <Route path="/admin" element={<RequireAuth><SessionLayout /></RequireAuth>}>
          {/* Command */}
          <Route index element={<ControlTower />} />
          <Route path="analytics" element={<ExecutiveAnalytics />} />
          <Route path="sales" element={<SalesCRM />} />
          <Route path="sales/*" element={<Placeholder title="Sales & CRM" />} />
          <Route path="crm" element={<Navigate to="/admin/sales" replace />} />

          {/* Delivery */}
          <Route path="cases" element={<CasesRegister />} />
          <Route path="cases/:caseId" element={<Placeholder title="Case details" />} />
          <Route path="verifier" element={<VerifierOperations />} />
          <Route path="verifiers" element={<Navigate to="/admin/verifier" replace />} />
          <Route path="qa" element={<QAReview />} />
          <Route path="exceptions" element={<Exceptions />} />
          <Route path="field" element={<FieldOperations />} />
          <Route path="reports" element={<ReleasedReports />} />
          {/* Stakeholders */}
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:clientId" element={<Placeholder title="Client account" />} />
          <Route path="client-portal" element={<ClientPortfolio />} />
          <Route path="portfolio" element={<Navigate to="/admin/client-portal" replace />} />
          <Route path="finance" element={<FinanceBilling />} />

          {/* Platform */}
          <Route path="users" element={<UsersAccess />} />
          <Route path="settings" element={<PlatformSettings />} />
          <Route path="audit" element={<AuditTrail />} />
          <Route path="security" element={<AccountSecurity />} />
          <Route path="account-security" element={<Navigate to="/admin/security" replace />} />
          <Route path="privacy" element={<PrivacyDesk />} />
          <Route path="privacy/retention" element={<Placeholder title="Retention preview & holds" />} />
          <Route path="privacy/vendors" element={<Placeholder title="Vendor data-sharing register" />} />

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
