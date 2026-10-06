/* =====================================================================
   Sample data for the Platform Settings page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { SettingsData } from "@/pages/platform-settings/PlatformSettingsPage";

const TIMEZONES = ["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "America/New_York", "UTC"];

export const SETTINGS: SettingsData = {
  workspace: [
    {
      id: "identity",
      title: "Workspace identity",
      subtitle: "Tenant identity and timezone stored by the platform.",
      status: "active",
      fields: [
        { id: "name", label: "Workspace name", type: "text", value: "Sapling Global" },
        { id: "timezone", label: "Timezone", type: "select", options: TIMEZONES, value: "Asia/Kolkata", hint: "Used for due dates, reports and sign-in times." },
      ],
    },
  ],
  delivery: [
    {
      id: "assignment",
      title: "Work assignment",
      subtitle: "How new checks reach verifiers.",
      fields: [
        { id: "autoAssign", label: "Auto-assign new checks", type: "toggle", value: false, hint: "When off, checks wait in Verifier Operations for manual allocation." },
        { id: "defaultPackage", label: "Default package", type: "select", options: ["Standard BGV", "HIGHPACKAGE"], value: "Standard BGV" },
      ],
    },
    {
      id: "field",
      title: "Field visits",
      subtitle: "Rules for address visits by field executives.",
      fields: [
        { id: "geofence", label: "Default geofence radius", type: "number", unit: "m", min: 10, max: 5000, value: 150, hint: "A visit recorded further away than this is flagged for review." },
        { id: "photoRequired", label: "Photo evidence required", type: "toggle", value: true },
      ],
    },
  ],
  sla: [
    {
      id: "sla",
      title: "Service levels",
      subtitle: "Default commitments for new client accounts.",
      fields: [
        { id: "clientSla", label: "Default client SLA", type: "number", unit: "days", min: 1, max: 60, value: 3 },
        { id: "riskWindow", label: "Flag as at risk", type: "number", unit: "hours before due", min: 1, max: 168, value: 24, hint: "Cases inside this window show as “SLA risk”." },
      ],
    },
    {
      id: "retention",
      title: "Data retention",
      subtitle: "How long records are kept before they are archived.",
      fields: [
        { id: "reports", label: "Released reports", type: "number", unit: "months", min: 1, max: 120, value: 84 },
        { id: "evidence", label: "Field evidence and documents", type: "number", unit: "months", min: 1, max: 120, value: 24 },
        { id: "audit", label: "Audit trail", type: "number", unit: "months", min: 12, max: 120, value: 84, hint: "Kept at least 12 months." },
      ],
    },
  ],
};
