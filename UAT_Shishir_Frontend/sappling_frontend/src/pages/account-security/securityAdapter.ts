import type { ActiveSession } from "@/lib/backend-api/auth";
import type { ActivityItem, ActivityType, SessionItem } from "./AccountSecurityPage";

/* =====================================================================
   Converts auth.ts data into what the Account Security page shows.
   ===================================================================== */

export function toSessionItem(s: ActiveSession): SessionItem {
  return {
    id: s.id,
    name: s.deviceName || (s.current ? "Current browser session" : "Unnamed browser session"),
    current: s.current,
    userAgent: s.userAgent ?? "",
    location: s.locationLabel ?? null,
    ip: s.ipAddress ?? "—",
    startedAt: s.createdAt,
    expiresAt: s.expiresAt,
  };
}

/* ---------------------------------------------------------------------
   Security events

   ⚠ The SecurityEvent fields weren't shared yet, so this reads them
     carefully by the most likely names. Once the type is confirmed,
     replace `unknown` with SecurityEvent and use its exact fields.
   --------------------------------------------------------------------- */

type Loose = Record<string, unknown>;
const text = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const pick = (o: Loose, ...keys: string[]) => keys.map((k) => text(o[k])).find(Boolean);

/** "auth.login.failed" → which pill to show */
export function activityTypeOf(action: string): ActivityType {
  const a = action.toLowerCase();
  if (/(fail|denied|invalid|blocked)/.test(a)) return "failed";
  if (a.includes("password")) return "password";
  if (/(anomal|suspicious|new[_-]?device|locked|impossible)/.test(a)) return "anomaly";
  return "login";
}

const TITLES: Record<string, string> = {
  "auth.login.succeeded": "Sign-in succeeded",
  "auth.login.failed": "Sign-in failed",
  "auth.logout": "Signed out",
  "auth.password.changed": "Password changed",
  "auth.session.revoked": "Session revoked",
};

/** "auth.session.revoked" → "Session revoked" when there's no fixed title */
export function titleOf(action: string): string {
  if (TITLES[action]) return TITLES[action];
  const words = action.replace(/^auth\./, "").split(/[._-]+/).filter(Boolean).join(" ");
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Account activity";
}

export function toActivityItem(event: unknown, index: number): ActivityItem {
  const e = (event ?? {}) as Loose;
  const action = pick(e, "action", "type", "eventType", "event") ?? "auth.activity";
  return {
    id: pick(e, "id", "publicId") ?? `event-${index}`,
    type: activityTypeOf(action),
    title: pick(e, "title", "label") ?? titleOf(action),
    device: pick(e, "deviceName", "locationLabel", "device") ?? "Unknown device",
    ip: pick(e, "ipAddress", "ip") ?? "—",
    userAgent: pick(e, "userAgent") ?? "",
    at: pick(e, "createdAt", "occurredAt", "timestamp", "at") ?? new Date(0).toISOString(),
  };
}

/** listSecurityEvents may return a list, or { items: [...] }; accept both */
export function eventsFrom(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  const r = (response ?? {}) as Loose;
  const list = r.items ?? r.events ?? r.data;
  return Array.isArray(list) ? list : [];
}
