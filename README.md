# Sapling Global Frontend

Frontend-only developer handover for the verification platform. React, TypeScript,
Vite, TanStack Router/Start and Tailwind CSS. This is not a Next.js application.

This repository contains the existing UI and API clients, not the application API,
database, credentials, uploaded candidate files or the original repository history.
The `src/lib/backend-api/` folder contains browser request functions, not backend code.

## 1. Install and run

Use Node.js 24 LTS and npm. Run commands from this repository's root:

```sh
git clone https://github.com/NavneetGreencall/Global-Frontend.git
cd Global-Frontend
npm ci
```

Copy `.env.example` to `.env`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```sh
# macOS / Linux
cp .env.example .env
```

Then run:

```sh
npm run dev
```

Open `http://localhost:8080/auth`. Stop the development server with Ctrl+C.
If PowerShell blocks `npm.ps1`, use `npm.cmd` instead of `npm`.

## 2. Configure the API

Put these values in the root `.env` file, not in components:

```dotenv
VITE_API_URL=/api/v1
VITE_TENANT_CODE=SAPLING
VITE_DEV_API_TARGET=http://127.0.0.1:4000
```

- `VITE_API_URL`: the base path used by browser requests. Keep `/api/v1` for the
  recommended same-origin setup.
- `VITE_TENANT_CODE`: the tenant code supplied by the project owner.
- `VITE_DEV_API_TARGET`: the separately running development API's origin, without
  `/api/v1`. The localhost default works only if an API runs on that machine.
- Restart `npm run dev` after editing environment values.

**A backend is required for login and real dashboard data.** Ask the owner for an
approved development API and limited testing credentials. These are not bundled.
Do not assume an existing UAT URL will accept a localhost session: the backend
validates the frontend origin and uses HttpOnly, SameSite=Strict cookies.
See [API integration](docs/API-INTEGRATION.md) before connecting to a remote API.

All `VITE_*` values are public browser configuration. Never put passwords, database
URLs, JWT secrets, storage keys or private provider keys in them.

## 3. Where to work

| Folder / file | Purpose |
| --- | --- |
| `src/routes/` | Route-level pages and workspace entry points |
| `src/features/` | Role/domain UI, hooks, feature-specific contracts and API adapters |
| `src/components/` | Shared components and UI primitives |
| `src/config/navigation*.ts` | Role sidebar definitions |
| `src/config/api.ts` | Central browser API base URL |
| `src/lib/backend-api/` | Shared request/session/upload/download functions |
| `src/lib/api/http/` | Repository adapters mapping API data to UI contracts |
| `src/lib/contracts/` | Shared frontend data types |
| `src/styles.css` | Global styles / design system |
| `src/server.ts` | Frontend SSR handler and security headers; not the business API |
| `public/` | Branding and static browser assets |
| `test/` | Local unit tests |
| `e2e/` | Browser tests; default suite uses synthetic fixtures |
| `vite.config.ts` | Local API proxy and frontend build configuration |

API-by-feature file locations are listed in [the API guide](docs/API-INTEGRATION.md).
Keep the existing colours, spacing and workflow unless the task explicitly changes
them. Do not manually edit `src/routeTree.gen.ts`; the router generates it.

## 4. Check your changes

```sh
npm run typecheck
npm run test:unit
npm run build
```

Optional local browser checks:

```sh
npm run test:e2e:install
npm run test:e2e
```

The default browser suite starts/stops its own local frontend and does not start a
backend. Full integration tests require `E2E_INTEGRATION=true`, an approved
`E2E_BASE_URL`, separately provided credentials and a disposable test environment.
Some integration tests create users/cases or change passwords; never enable them
against shared UAT without approval. Test credentials must stay out of Git.

## 5. Build / deploy

```sh
npm run build
npm start
```

The production Node entry is `.output/server/index.mjs`; set `PORT`/`HOST` through
your hosting environment. This is an SSR build, not just a static `dist` folder.
Production needs a reverse proxy routing `/api/v1` to the separately hosted API.
Vite's development proxy does not run in production or provide API routing for
`npm run preview`. The deployment owner configures HTTPS and origin/cookies.
Public build-time values belong in an uncommitted `.env.production` if different.

## 6. Working agreement and confidentiality

- Create a feature branch and submit a pull request; do not push directly to main.
- This repository is a separate frontend handover. Changes are reviewed and then
  ported back into the full platform's `frontend/` folder; syncing is not automatic.
- Do not give yourself broader permissions or bypass backend authorization to
  demonstrate a screen. Ask for the correct test role and scope.
- Never commit real `.env` files, access tokens, candidate evidence or real exports.
- Do not upload company source, secrets or customer data to external AI tools or
  other third-party services without company approval. Report accidental disclosure
  to the project owner immediately so credentials can be rotated where needed.
- Keep API errors, loading states, document permissions and audit-sensitive actions
  intact while changing the UI.
