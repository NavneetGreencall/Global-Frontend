/* =====================================================================
   Sample data or live API?

   VITE_USE_SAMPLE_DATA=true  → pages show their built-in sample data
   VITE_USE_SAMPLE_DATA=false → pages that are connected load from the API
   (set in .env, then restart npm run dev)
   ===================================================================== */
export const USE_SAMPLE_DATA: boolean = import.meta.env.VITE_USE_SAMPLE_DATA !== "false";

/** Tenant code sent with the login request (VITE_TENANT_CODE in .env, e.g. SAPLING) */
export const TENANT_CODE: string = import.meta.env.VITE_TENANT_CODE || "";
