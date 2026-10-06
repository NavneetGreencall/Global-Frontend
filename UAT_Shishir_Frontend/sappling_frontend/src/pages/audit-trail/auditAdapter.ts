import type { AuditEvent } from "@/lib/backend-api/audit";
import type { AuditCategory, AuditChange, AuditEventItem } from "./AuditTrailPage";

/* =====================================================================
   Converts the API's AuditEvent into what the Audit Trail page shows.
   The API types come from src/lib/backend-api/audit.ts (copied, unchanged).
   ===================================================================== */

/** Pick a category pill from the action name (e.g. "auth.login.failed" → Security) */
export function categoryOf(action: string, resourceType: string): AuditCategory {
  const a = action.toLowerCase();
  const r = resourceType.toLowerCase();
  if (/(failed|denied|locked|revoked|password|mfa|otp|session)/.test(a)) return "security";
  if (a.startsWith("auth.") || a.startsWith("login") || r === "user") return "access";
  if (a.startsWith("settings.") || r.includes("setting") || r.includes("config")) return "configuration";
  if (a.startsWith("report.") || r.includes("report")) return "report";
  if (a.startsWith("case.") || r.includes("case") || r.includes("check")) return "case";
  return "other";
}

const MAX_VALUE_LENGTH = 300; // long values are shortened with "…"

function parseJson(json?: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return json; // not JSON: show the text as it is
  }
}

function showValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > MAX_VALUE_LENGTH ? text.slice(0, MAX_VALUE_LENGTH) + "…" : text;
}

const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);

/** Compare beforeJson and afterJson and list only the fields that changed */
export function changesBetween(beforeJson?: string | null, afterJson?: string | null): AuditChange[] {
  const before = parseJson(beforeJson);
  const after = parseJson(afterJson);
  if (before === null && after === null) return [];

  if (isObject(before) || isObject(after)) {
    const b = isObject(before) ? before : {};
    const a = isObject(after) ? after : {};
    const fields = [...new Set([...Object.keys(b), ...Object.keys(a)])];
    return fields
      .filter((f) => JSON.stringify(b[f]) !== JSON.stringify(a[f]))
      .map((f) => ({ field: f, from: showValue(b[f]), to: showValue(a[f]) }));
  }
  return [{ field: "value", from: showValue(before), to: showValue(after) }];
}

export function toAuditEvent(e: AuditEvent): AuditEventItem {
  return {
    id: e.id,
    category: categoryOf(e.action, e.resourceType),
    action: e.action,
    resource: e.resourcePublicId ? `${e.resourceType}/${e.resourcePublicId}` : e.resourceType,
    actor: e.actor?.displayName || "System",
    actorType: e.actor?.email || "Automated",
    device: e.locationLabel || "Location unavailable",
    ip: e.ipAddress || "—",
    requestId: e.requestId ?? null,
    at: e.createdAt,
    changes: changesBetween(e.beforeJson, e.afterJson),
  };
}
