/* =====================================================================
   Sample data for the "Create user ID" dialog (assignable roles, branches and clients).
   Shown when VITE_USE_SAMPLE_DATA=true (no backend needed).
   ===================================================================== */

export const SAMPLE_POLICY = {
  enabled: true,
  roles: ["PLATFORM_ADMIN", "OPERATIONS_MANAGER", "VERIFIER", "QA_REVIEWER", "CLIENT_ADMIN", "FIELD_EXECUTIVE", "SALES_MANAGER", "FINANCE_MANAGER"],
  branches: [{ id: "b-head", name: "Head Office", city: "Bengaluru" }],
  tenantWideAllowed: true,
};

export const SAMPLE_CLIENTS = { items: [{ publicId: "c-acme", displayName: "Acme India" }, { publicId: "c-irfc", displayName: "IRFC" }] };
