/* =====================================================================
   Sample data for the Audit Trail page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { AuditEventItem } from "@/pages/audit-trail/AuditTrailPage";

export const EVENTS: AuditEventItem[] = [
  {
    id: "e1", category: "access", action: "auth.login.succeeded", resource: "user/e84f8780-5a29-44bb-ab23-fdfa32f439c8",
    actor: "Roopesh kumar", actorType: "Platform user", device: "Local device", ip: "127.0.0.1", requestId: null,
    at: "2026-09-30T15:22:00+05:30",
    changes: [{ field: "userAgent", from: null, to: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36" }],
  },
  {
    id: "e2", category: "access", action: "auth.login.succeeded", resource: "user/fe5620c1-0b22-477b-822a-5a1421015231",
    actor: "Verifier", actorType: "Platform user", device: "Local device", ip: "127.0.0.1", requestId: null,
    at: "2026-09-30T15:02:00+05:30",
    changes: [{ field: "userAgent", from: null, to: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36" }],
  },
  {
    id: "e3", category: "access", action: "auth.login.succeeded", resource: "user/e84f8780-5a29-44bb-ab23-fdfa32f439c8",
    actor: "Roopesh kumar", actorType: "Platform user", device: "Local device", ip: "127.0.0.1", requestId: null,
    at: "2026-09-30T14:43:00+05:30",
    changes: [{ field: "userAgent", from: null, to: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36" }],
  },
  {
    id: "e4", category: "access", action: "auth.login.succeeded", resource: "user/0b80f142-415d-4e0f-88b7-bd52a97b11a8",
    actor: "CEO", actorType: "Platform user", device: "Local device", ip: "127.0.0.1", requestId: null,
    at: "2026-09-30T14:42:00+05:30",
    changes: [{ field: "userAgent", from: null, to: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36" }],
  },
  // SAMPLE events below — replace with real data
  {
    id: "e5", category: "configuration", action: "settings.workspace.updated", resource: "settings/identity",
    actor: "Nikhil", actorType: "Platform admin", device: "Local device", ip: "127.0.0.1", requestId: "req_7f3a91",
    at: "2026-09-30T13:10:00+05:30",
    changes: [{ field: "timezone", from: "UTC", to: "Asia/Kolkata" }],
  },
  {
    id: "e6", category: "security", action: "auth.login.failed", resource: "user/unknown",
    actor: "Unknown", actorType: "Anonymous", device: "Unrecognised device", ip: "10.0.4.18", requestId: "req_2b18c4",
    at: "2026-09-30T12:05:00+05:30",
    changes: [{ field: "reason", from: null, to: "Wrong password (3rd attempt)" }],
  },
  {
    id: "e7", category: "case", action: "case.owner.assigned", resource: "case/SG-20260928-600E89",
    actor: "Nikhil", actorType: "Platform admin", device: "Local device", ip: "127.0.0.1", requestId: "req_91ce02",
    at: "2026-09-30T11:48:00+05:30",
    changes: [{ field: "owner", from: null, to: "Verification Specialist" }],
  },
  {
    id: "e8", category: "report", action: "report.released", resource: "report/SG-20260908-9A1B2C",
    actor: "Manager", actorType: "Platform user", device: "Local device", ip: "127.0.0.1", requestId: "req_44d7aa",
    at: "2026-09-29T16:20:00+05:30",
    changes: [{ field: "status", from: "Approved", to: "Released" }],
  },
];
