/* =====================================================================
   Sample data for the Clients page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { ClientAccount } from "@/pages/clients/ClientsPage";

export const CLIENTS: ClientAccount[] = [
  { id: "c1", name: "Acme India", code: "ACME", legalName: "Acme India Private Limited", status: "active", activeCases: 3, portfolio: 3, slaAttainment: null, atRisk: 3, contact: "Neha Verma", slaDays: 3, activeSinceHours: 1031 },
  { id: "c2", name: "Acme Tech Solutions", code: "CRM-B15D268CCD4B4F15A263C341", legalName: "Acme Tech Solutions", status: "active", activeCases: 3, portfolio: 3, slaAttainment: null, atRisk: 3, contact: "Rahul Sharma", slaDays: 3, activeSinceHours: 450 },
  { id: "c3", name: "IRFC", code: "CRM-5B09FC207C7C4194B6F5E159", legalName: "IRFC", status: "active", activeCases: 1, portfolio: 1, slaAttainment: null, atRisk: 1, contact: "Singh", slaDays: 3, activeSinceHours: 451 },
  { id: "c4", name: "Navneet Kirana", code: "N0001", legalName: "Navneet", status: "active", activeCases: 5, portfolio: 5, slaAttainment: null, atRisk: 5, contact: null, slaDays: 3, activeSinceHours: 840 },
  // SAMPLE rows below — replace with real data
  { id: "c5", name: "Nikhil Tech", code: "NT01", legalName: "Nikhil Tech", status: "active", activeCases: 2, portfolio: 2, slaAttainment: 100, atRisk: 0, contact: "Nikhil", slaDays: 3, activeSinceHours: 700 },
  { id: "c6", name: "Vision India Pvt Limited.", code: "VIPL", legalName: "Vision India Pvt Limited.", status: "onboarding", activeCases: 2, portfolio: 2, slaAttainment: null, atRisk: 2, contact: null, slaDays: 5, activeSinceHours: 120 },
];
