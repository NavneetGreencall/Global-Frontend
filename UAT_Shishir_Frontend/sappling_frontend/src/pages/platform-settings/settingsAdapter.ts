import type { AccessPolicy, FieldPolicy, Organisation } from "@/lib/backend-api/settings";
import type { SettingsData } from "./PlatformSettingsPage";

/* =====================================================================
   Builds the Platform Settings tabs from settings.ts:
   - Workspace:        organisation (name, timezone) + access policy
   - Delivery setup:   field policy (geofence, GPS accuracy, photos, check-out, outside-geofence rule)
   - SLA & retention:  field evidence retention
   Card ids (identity, access, field, retention) tell the route which API saves them.
   ===================================================================== */

export const GEOFENCE_RULES: Record<FieldPolicy["outsideGeofencePolicy"], string> = {
  BLOCK: "Block the visit",
  SUPERVISOR_APPROVAL: "Needs supervisor approval",
  ALLOW_AND_FLAG: "Allow and flag for review",
};
const RULE_BY_LABEL = Object.fromEntries(Object.entries(GEOFENCE_RULES).map(([k, v]) => [v, k])) as Record<string, FieldPolicy["outsideGeofencePolicy"]>;
export const ruleFromLabel = (label: string) => RULE_BY_LABEL[label] ?? "SUPERVISOR_APPROVAL";

export function toSettings(org: Organisation, access: AccessPolicy | undefined, field: FieldPolicy | undefined): SettingsData {
  return {
    workspace: [
      {
        id: "identity",
        title: "Workspace identity",
        subtitle: "Tenant identity and timezone stored by the platform.",
        status: org.status.toUpperCase() === "ACTIVE" ? "active" : undefined,
        fields: [
          { id: "name", label: "Workspace name", type: "text", value: org.name },
          { id: "timezone", label: "Timezone", type: "select", options: [org.timezone], value: org.timezone, hint: "Set by the platform team." },
        ],
      },
      ...(access
        ? [{
            id: "access",
            title: "User creation",
            subtitle: "Who may create user IDs.",
            fields: [{ id: "opsUserCreationEnabled", label: "Operations managers can create users", type: "toggle" as const, value: access.opsUserCreationEnabled }],
          }]
        : []),
    ],
    delivery: field
      ? [{
          id: "field",
          title: "Field visits",
          subtitle: "Rules for address visits by field executives.",
          fields: [
            { id: "defaultRadiusMeters", label: "Default geofence radius", type: "number", unit: "m", min: 10, max: 5000, value: field.defaultRadiusMeters, hint: "A visit further away than this needs review." },
            { id: "maxAccuracyMeters", label: "Required GPS accuracy", type: "number", unit: "m", min: 5, max: 1000, value: field.maxAccuracyMeters },
            { id: "minimumPhotos", label: "Minimum photos per visit", type: "number", min: 0, max: 20, value: field.minimumPhotos },
            { id: "requireCheckout", label: "Check-out required", type: "toggle", value: field.requireCheckout },
            { id: "outsideGeofencePolicy", label: "Visit outside the geofence", type: "select", options: Object.values(GEOFENCE_RULES), value: GEOFENCE_RULES[field.outsideGeofencePolicy] },
          ],
        }]
      : [],
    sla: field
      ? [{
          id: "retention",
          title: "Data retention",
          subtitle: "How long field evidence is kept.",
          fields: [{ id: "retentionDays", label: "Field evidence", type: "number", unit: "days", min: 1, max: 3650, value: field.retentionDays }],
        }]
      : [],
  };
}
