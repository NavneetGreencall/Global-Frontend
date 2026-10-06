/* =====================================================================
   Sample data for the Client Portfolio page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { ClientResponse, PortfolioStage, PortfolioStats } from "@/pages/client-portfolio/ClientPortfolioPage";

export const STATS: PortfolioStats = { activePortfolio: 15, openClarifications: 0, overdueCases: 15, completed: 1, completedToday: 0 };

// In workflow order.
//   color:      the dot and bar colour for that stage
//   casesStage: the stage name the Cases register uses, so clicking a row
//               opens /admin/cases already filtered to that stage
//   done:       true for finished work (not counted as "in flight")
export const STAGES: PortfolioStage[] = [
  { id: "consent_pending", label: "Consent pending", count: 3, color: "#e0a015", casesStage: "consent" },
  { id: "document_pending", label: "Document pending", count: 3, color: "#f08a24", casesStage: "documents" },
  { id: "in_progress", label: "In progress", count: 7, color: "#2b7fd4", casesStage: "verification" },
  { id: "qa_review", label: "QA review", count: 2, color: "#7552e0", casesStage: "qa" },
  { id: "completed", label: "Completed", count: 1, color: "#22a65a", casesStage: "completed", done: true },
];

export const RESPONSES: ClientResponse[] = [];
