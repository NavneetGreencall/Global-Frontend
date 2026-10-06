# Sapling Global admin (Vite + React + TypeScript)

## Run it

```sh
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run dev                 # http://localhost:8080
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run typecheck` | Checks all TypeScript types (strict mode). Settings: `tsconfig.json` (app) and `tsconfig.node.json` (vite.config.ts) |
| `npm run build` | Type-checks, then builds the production files into `dist/` |
| `npm run preview` | Serves the built `dist/` folder locally |

## Folders

```
src/
  main.tsx                 entry point; loads the shared styles once
  App.tsx                  routes for every /admin/... page
  vite-env.d.ts            types for .env values and CSS/PNG imports

  layout/                  the app shell, shared by every page
    AppLayout.tsx          sidebar + header + page area (no reload between pages)
    Sidebar.tsx, Header.tsx
    navigation.ts          sidebar menu: sections, labels, links, icons
    brand.ts               logo and organisation name
    icons.tsx              line icons used by the shell
    types.ts               ShellUser, ShellProps
    index.ts               import { Header, Sidebar, SAPLING_LOGO } from "@/layout"

  components/ui/           small shared pieces, all importable from "@/components/ui":
    Pagination.tsx         the one pager for every list (page numbers, or "Load more")
    usePagination.ts       splits a list into pages and resets to page 1 when filters change
    PageState.tsx          loading screen, and error with "Try again"

  pages/                   one folder per page, everything for that page together
    audit-trail/
      AuditTrailPage.tsx   the page (works with sample data or live data)
      AuditTrailRoute.tsx  loads data from the API and passes it to the page
      auditAdapter.ts      converts API data into what the page shows
      audit-trail.css      styles used only by this page
    account-security/ …    same pattern
    cases/, clients/, …    page (+ its CSS); route + adapter added as pages are connected

  auth/                    sign-in: session.tsx (session check, sign-out) and LoginPage.tsx

  sample-data/             ALL sample data, one file per page (used when VITE_USE_SAMPLE_DATA=true)
    control-tower.ts, cases.ts, users-access.ts, …   one per page
    user.ts                the sample signed-in user
    notifications.ts       sample notifications in the header
    assign-owner.ts, create-user.ts                   samples for the dialogs

  styles/                  shared styles, loaded once from main.tsx
    app.css                design tokens, app shell, page background (+ Control Tower)
    dashboard.css          page hero, stat cards, panels, charts (+ Executive Analytics)
    tables.css             buttons, fields, menus, data tables, pills (+ Cases)
    lists.css              list cards, list rows, filter tabs (+ Exceptions)
    page-kit.css           page header, summary cards, search, filters, empty state, pager (+ Released reports)

  config/                  api.ts (from the other frontend), data-mode.ts (sample or live data)
  lib/, features/          API layer copied from the other frontend, unchanged
  assets/                  sapling-logo.png
```

**Where to change things**
- A page's layout or text → `src/pages/<page>/<Name>Page.tsx`
- A page's look → `src/pages/<page>/<page>.css` (or the shared file in `src/styles/` named in the comment at its top)
- The sidebar menu → `src/layout/navigation.ts`
- The logo → replace `src/assets/sapling-logo.png`
- The sample data → `src/sample-data/<page>.ts`
- Sample data vs real API → `VITE_USE_SAMPLE_DATA=true for sample data and VITE_USE_SAMPLE_DATA=false` for real api data in `.env`

## Connecting the API

- Each page takes its data through props and reports actions through callbacks
  (`onAssign`, `onSave`, `onRevoke` …). Every data shape has an exported type at the
  top of its page file, e.g. `CaseRow` in `CaseRegister.tsx`.
- Browser requests go to `/api/v1`. In development `vite.config.ts` forwards them to
  `VITE_DEV_API_TARGET` from `.env`. In production a reverse proxy must route `/api/v1`
  to the API, and the web server must return `index.html` for any `/admin/...` URL.
- `VITE_*` values are public. Never put passwords, tokens or secrets in `.env` files
  that the browser can read.
