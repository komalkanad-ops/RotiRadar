# RotiRadar

On-demand home-cook marketplace for India. Book a verified cook to come to your home and cook
fresh meals for a 1–2 hour slot; cooks earn hourly. — [rotiradar.in](https://rotiradar.in)

This repository holds the web-facing surfaces. The native mobile apps live in a separate
repository.

## Repo layout

| Path | What | Stack |
|---|---|---|
| `web/` | Marketing site — `rotiradar.in` | React + Vite + TypeScript + Tailwind (static SPA) |
| `admin-console/` | Operations & moderation — `admin.rotiradar.in` | React + Vite + TypeScript + Tailwind (static SPA) |
| `backend/` | REST API — `api.rotiradar.in` | Node + Express + Prisma + MySQL |

## Status

**Phase 0 — scaffold + marketing website.** `web/` is complete and deployable; `backend/` and
`admin-console/` build but have no features yet.

## Local development

```bash
# Website
cd web && npm install && npm run dev

# Backend (needs a local MySQL + backend/.env — see backend/.env.example)
cd backend && npm install && npm run dev

# Admin console
cd admin-console && npm install && npm run dev
```

## Deployment

`web/` and `admin-console/` deploy from `main` via Hostinger static-site Git import; `backend/`
deploys from a `backend-root` branch to Hostinger Node.js hosting, backed by a Hostinger MySQL
database. All secrets are supplied as environment variables — nothing sensitive is committed.

## Conventions

- TypeScript strict mode. API responses are JSON: success returns the resource/array directly;
  errors return `{ error: string, requestId?: string }` with a correct HTTP status.
- Money is stored and transmitted as integer paise, never floats.
- Booking status lifecycle: `PENDING → ACCEPTED → ON_THE_WAY → IN_PROGRESS → COMPLETED`, plus
  `CANCELLED` from any pre-completion state.
