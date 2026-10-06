/* =====================================================================
   Sample data for the Account Security page.
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   In live mode the page gets real data from the API instead.
   ===================================================================== */

import type { ActivityItem, SessionItem } from "@/pages/account-security/AccountSecurityPage";

export const PASSWORD_UPDATED_AT = "2026-09-07T15:49:00+05:30";

export const SESSIONS: SessionItem[] = [
  {
    id: "s1", name: "Current browser session", current: true,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0",
    location: null, ip: "182.78.76.2", startedAt: "2026-09-30T15:53:00+05:30", expiresAt: "2026-10-07T15:53:00+05:30",
  },
  {
    id: "s2", name: "Unnamed browser session", current: false,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
    location: null, ip: "122.176.104.152", startedAt: "2026-09-29T12:00:00+05:30", expiresAt: "2026-10-06T12:00:00+05:30",
  },
];

export const CHROME_153 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36";

export const ACTIVITY: ActivityItem[] = [
  { id: "a1", type: "login", title: "Sign-in succeeded", device: "Local device", ip: "127.0.0.1", userAgent: CHROME_153, at: "2026-09-29T15:37:00+05:30" },
  { id: "a2", type: "login", title: "Sign-in succeeded", device: "Local device", ip: "127.0.0.1", userAgent: CHROME_153, at: "2026-09-29T15:25:00+05:30" },
  { id: "a3", type: "login", title: "Sign-in succeeded", device: "Local device", ip: "127.0.0.1", userAgent: CHROME_153, at: "2026-09-29T13:30:00+05:30" },
  { id: "a4", type: "password", title: "Password changed", device: "Local device", ip: "127.0.0.1", userAgent: CHROME_153, at: PASSWORD_UPDATED_AT },
  // SAMPLE event below — replace with real data
  { id: "a5", type: "failed", title: "Sign-in failed: wrong password", device: "Unrecognised device", ip: "10.0.4.18", userAgent: CHROME_153, at: "2026-09-05T09:12:00+05:30" },
];
