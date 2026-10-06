import { useQuery, useQueryClient } from "@tanstack/react-query";
import PlatformSettings from "./PlatformSettingsPage";
import type { FieldValue } from "./PlatformSettingsPage";
import { ruleFromLabel, toSettings } from "./settingsAdapter";
import { PageError, PageLoading } from "@/components/ui";
import { getAccessPolicy, getFieldPolicy, getOrganisation, updateAccessPolicy, updateFieldPolicy } from "@/lib/backend-api/settings";
import { USE_SAMPLE_DATA } from "@/config/data-mode";

/* =====================================================================
   Platform Settings: connects the page to settings.ts.
   Saves send the policy's version, so a change made by someone else
   in the meantime is reported instead of overwritten.
   The organisation itself has no update API, so it is read-only.
   ===================================================================== */

const messageOf = (err: unknown) => (err instanceof Error && err.message) || "Something went wrong.";

function LivePlatformSettings() {
  const queryClient = useQueryClient();
  const org = useQuery({ queryKey: ["settings", "organisation"], queryFn: getOrganisation });
  const access = useQuery({ queryKey: ["settings", "access"], queryFn: getAccessPolicy });
  const field = useQuery({ queryKey: ["settings", "field"], queryFn: getFieldPolicy });

  if (org.isError && !org.data) return <PageError message={messageOf(org.error)} onRetry={() => org.refetch()} />;
  if (!org.data || access.isPending || field.isPending) return <PageLoading label="Loading settings…" />;

  const save = async (cardId: string, values: Record<string, FieldValue>) => {
    if (cardId === "identity") throw new Error("The workspace name and timezone can only be changed by the platform team.");
    if (cardId === "access") {
      if (!access.data) throw new Error("The access policy couldn't be loaded.");
      await updateAccessPolicy({ version: access.data.version, opsUserCreationEnabled: Boolean(values.opsUserCreationEnabled) });
      await queryClient.invalidateQueries({ queryKey: ["settings", "access"] });
      return;
    }
    if (cardId === "field" || cardId === "retention") {
      const f = field.data;
      if (!f) throw new Error("The field policy couldn't be loaded.");
      await updateFieldPolicy({
        version: f.version,
        defaultRadiusMeters: Number(values.defaultRadiusMeters ?? f.defaultRadiusMeters),
        maxAccuracyMeters: Number(values.maxAccuracyMeters ?? f.maxAccuracyMeters),
        minimumPhotos: Number(values.minimumPhotos ?? f.minimumPhotos),
        retentionDays: Number(values.retentionDays ?? f.retentionDays),
        requireCheckout: values.requireCheckout === undefined ? f.requireCheckout : Boolean(values.requireCheckout),
        outsideGeofencePolicy: values.outsideGeofencePolicy === undefined ? f.outsideGeofencePolicy : ruleFromLabel(String(values.outsideGeofencePolicy)),
      });
      await queryClient.invalidateQueries({ queryKey: ["settings", "field"] });
    }
  };

  return <PlatformSettings settings={toSettings(org.data, access.data, field.data)} onSave={save} />;
}

export default function PlatformSettingsRoute() {
  return USE_SAMPLE_DATA ? <PlatformSettings /> : <LivePlatformSettings />;
}
