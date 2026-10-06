/* =====================================================================
   Sidebar menu: sections, items, links and icons.
   Add or move pages here; the sidebar and active highlight follow.
   ===================================================================== */

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  count?: number;
  urgent?: boolean;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

/** Pipeline stage. state: "moving" | "waiting" | "closed" | "clear" */

export const NAV: NavSection[] = [
  {
    section: "Command",
    items: [
      { id: "control-tower", label: "Control Tower", href: "/admin", icon: "grid" },
      { id: "analytics", label: "Executive Analytics", href: "/admin/analytics", icon: "trend" },
      { id: "sales", label: "Sales & CRM", href: "/admin/sales", icon: "gauge" },
    ],
  },
  {
    section: "Delivery",
    items: [
      { id: "cases", label: "Cases & Delivery", href: "/admin/cases", icon: "list", count: 15 },
      { id: "verifiers", label: "Verifier Operations", href: "/admin/verifier", icon: "check" },
      { id: "qa", label: "QA Review", href: "/admin/qa", icon: "file", count: 2 },
      { id: "exceptions", label: "Exceptions", href: "/admin/exceptions", icon: "alert", count: 9, urgent: true },
      { id: "field", label: "Field Operations", href: "/admin/field", icon: "pin" },
      { id: "reports", label: "Released reports", href: "/admin/reports", icon: "doc" },
    ],
  },
  {
    section: "Stakeholders",
    items: [
      { id: "clients", label: "Clients", href: "/admin/clients", icon: "building" },
      { id: "portfolio", label: "Client Portfolio", href: "/admin/client-portal", icon: "pulse" },
      { id: "finance", label: "Finance & Billing", href: "/admin/finance", icon: "wallet" },
    ],
  },
  {
    section: "Platform",
    items: [
      { id: "users", label: "User IDs & Access", href: "/admin/users", icon: "users" },
      { id: "settings", label: "Platform Settings", href: "/admin/settings", icon: "sliders" },
      { id: "audit", label: "Audit Trail", href: "/admin/audit", icon: "shield" },
      { id: "security", label: "Account Security", href: "/admin/security", icon: "key" },
      { id: "privacy", label: "Privacy desk", href: "/admin/privacy", icon: "lock" },
    ],
  },
];
