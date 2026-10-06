/* Types shared by the app shell and every page */

export interface ShellUser {
  name: string;
  role: string;
  onSignOut: () => void;
}

/** Props every page accepts for the app shell */
export interface ShellProps {
  logoSrc?: string;
  orgName?: string;
  user?: ShellUser;
  onSearch?: (query: string) => void;
}
