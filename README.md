# TWIN Node POC — Onboarding Tour

A self-contained Next.js app that talks to a hosted [TWIN](https://github.com/twinfoundation) node and lets new team members explore TWIN capabilities without setting up a local environment.

## What's inside

- **`/twin-tour`** — guided one-page tour of the live node (default landing page). Read-only, no login required when the app is deployed in service-account mode.
- **`/twin-showcase`** — manual login flow demo (for users with their own DID).
- **`/api/twin-node/*`** — server-side proxies (GET-only) that hide the admin token from the browser:
  - `/info`, `/health` — public node metadata
  - `/identity/[did]` — resolve a W3C DID Document
  - `/profile` — own (private) identity profile
  - `/agent?id=<did>` — public profile of any DID
  - `/logging` — recent node log entries
  - `/login`, `/logout`, `/verify` — interactive auth (used by `/twin-showcase`)

## Architecture

```
Browser ──HTTPS──▶ Next.js (Vercel) ──HTTPS + Bearer──▶ TWIN node (AWS)
              ▲                  ▲
       /twin-tour         /api/twin-node/*
       (HTML)             (server-only proxies)
```

Admin credentials live only in Vercel env vars; the browser never sees them.

## Local development

1. `cp .env.local.example .env.local` and fill in `TWIN_NODE_SERVICE_PASSWORD`
2. `npm install`
3. `npm run dev` → http://localhost:3000

The home page redirects to `/twin-tour`.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import in Vercel → framework auto-detects Next.js
3. Set environment variables (Production + Preview):

   | Key                          | Value                                        |
   | ---------------------------- | -------------------------------------------- |
   | `TWIN_NODE_URL`              | `https://kitsune.staging.twinnodes.com`      |
   | `TWIN_NODE_SERVICE_EMAIL`    | `admin@node`                                 |
   | `TWIN_NODE_SERVICE_PASSWORD` | _(from node admin)_                          |

4. Deploy. Share the URL.

## Pointing at a different node

Swap `TWIN_NODE_URL` and the matching service credentials. The tour will gracefully degrade for endpoints the new node doesn't expose (each card surfaces the error inline rather than crashing).

## Configuration modes

- **Service-account mode** (recommended for onboarding): set both `TWIN_NODE_SERVICE_*` vars. Visitors see live node data immediately.
- **User-login mode**: leave service vars empty. Visitors must log in via `/twin-showcase/login` with their own credentials before any protected proxy works.

## Capabilities by node profile

The kitsune staging node is **identity-only**. It exposes:

- `/info`, `/health`
- `/authentication/login`, `/authentication/refresh`
- `/identity/:did`, `/identity/profile`, `/identity/profile/:did/public`
- `/logging`

It does **not** expose NFT, Attestation, Auditable Item Graph/Stream, Blob storage, or Wallet — those live in other TWIN deployments. The tour's last section links to each module's repo.

## Security notes

- All proxy routes are GET-only. No write operation on the node is reachable from the public site, even though the service account has `tenant-admin` scope.
- The admin password must never be committed. `.env.local` is gitignored; production secrets live only in Vercel.
- The tour page is rendered on-demand (`force-dynamic`) so service tokens never end up baked into static HTML.

## Tech

Next.js 16 (App Router) · React 19 · Tailwind 4 · TypeScript 5 · `next-intl` for routing.

For deeper setup, troubleshooting and CORS notes see [TWIN_NODE_SETUP.md](./TWIN_NODE_SETUP.md).
