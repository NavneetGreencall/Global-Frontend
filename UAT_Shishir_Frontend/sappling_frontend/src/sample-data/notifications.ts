/* =====================================================================
   Sample data for the header's notifications panel.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   ===================================================================== */

import type { HeaderNotification } from "@/layout/Header";

/** Shown only with sample data, so the panel can be tried out */
export const SAMPLE_NOTIFICATIONS: HeaderNotification[] = [
  { id: "n1", title: "Critical exception", text: "SG-20260924 is past its committed due date.", at: new Date(Date.now() - 25 * 60_000).toISOString(), href: "/admin/exceptions" },
  { id: "n2", title: "QA review waiting", text: "2 cases are waiting at the quality gate.", at: new Date(Date.now() - 3 * 3_600_000).toISOString(), href: "/admin/qa" },
  { id: "n3", title: "Client clarification", text: "Acme India replied about employment dates.", at: new Date(Date.now() - 26 * 3_600_000).toISOString(), href: "/admin/client-portal", read: true },
];
