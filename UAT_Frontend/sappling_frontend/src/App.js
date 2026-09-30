import { lazy, useEffect } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout, SAPLING_LOGO } from "./Pages/ControlTower";
import "./Styles/ControlTower.css";

/*
  Routing for the Sapling Global admin.

  Setup (once):
    npm install react-router-dom

  Then render <App /> from your entry file (main.jsx or index.js):
    import App from "./App";
    createRoot(document.getElementById("root")).render(<App />);

  Page files live in src/Pages/, styles in src/Styles/ (App.js sits in src/).

  All /admin pages share one <AppLayout>, so the sidebar and header stay on
  screen while you move between pages (no reload, no flash).
*/

const pages = {
  ControlTower: () => import("./Pages/ControlTower"),
  ExecutiveAnalytics: () => import("./Pages/ExecutiveAnalytics"),
  SalesCRM: () => import("./Pages/SaleCrm"),
  CasesRegister: () => import("./Pages/CaseRegister"),
  VerifierOperations: () => import("./Pages/VerifierOperations"),
  QAReview: () => import("./Pages/QaReview"),
  Exceptions: () => import("./Pages/Exceptions"),
  FieldOperations: () => import("./Pages/FieldOperations"),
  ReleasedReports: () => import("./Pages/ReleasedReports"),
  Clients: () => import("./Pages/Clients"),
  ClientPortfolio: () => import("./Pages/Clientportfolio"),
  FinanceBilling: () => import("./Pages/FinanceBilling"),
  UsersAccess: () => import("./Pages/Useraccess"),
  PlatformSettings: () => import("./Pages/Platformsettings"),
  AuditTrail: () => import("./Pages/Audittrail"),
  AccountSecurity: () => import("./Pages/Accountsecurity"),
};

// Loads a page and gives a clear error if the file has no default export
const lazyPage = (name) =>
  lazy(() =>
    pages[name]().then((m) => {
      if (typeof m.default !== "function") {
        throw new Error(`${name}.jsx has no "export default" component. Check that the file is saved and contains the page code.`);
      }
      return m;
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

// Connect your existing pages the same way, e.g.
// e.g. const PrivacyDesk = lazyPage("PrivacyDesk"); after adding it to the pages list

// Download the other pages quietly after the first screen has loaded,
// so switching pages is instant.
function usePreloadPages() {
  useEffect(() => {
    const load = () => Object.values(pages).forEach((fn) => fn());
    const id = "requestIdleCallback" in window ? window.requestIdleCallback(load) : setTimeout(load, 1500);
    return () => ("cancelIdleCallback" in window ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);
}

/* ---------------------------------------------------------------------
   Simple pages shown inside the layout
   --------------------------------------------------------------------- */

function Message({ title, message, actionLabel }) {
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

const Placeholder = ({ title }) => (
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

        <Route path="/admin" element={<AppLayout />}>
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
          <Route path="privacy" element={<Placeholder title="Privacy desk" />} />

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}