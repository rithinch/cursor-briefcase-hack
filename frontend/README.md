# Pulp Dashboard

React + TypeScript frontend for the Pulp financial operations dashboard. Built with Vite, Zustand, and Framer Motion.

## Prerequisites

- Node.js 18+ (v20 recommended — Vite 5 requires 18+)
- npm

If you use nvm, the included `.nvmrc` pins v20:

```bash
nvm use
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The app runs at [http://localhost:5173](http://localhost:5173).

## Environment Variables

By default, API requests are proxied to `http://localhost:8000`. To point at a different backend:

```bash
VITE_API_URL=http://your-backend-host:8000 npm run dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with HMR on port 5173 |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Serve the production build locally |

## Running with Docker

To run the full stack (frontend + backend + Postgres) via Docker Compose:

```bash
# From the repo root
cp .env.example .env  # set ANTHROPIC_API_KEY and DATABASE_URL
docker compose -f frontend/docker-compose.yml up --build
```

The frontend is served on [http://localhost:3000](http://localhost:3000) via Nginx, which also proxies `/v1/*` to the backend.

## Project Structure

```
src/
├── api/          # API client functions
├── brand/        # Logo and brand assets
├── components/   # Shared UI components
├── pages/        # Route-level page components
├── store/        # Zustand global state
└── types/        # TypeScript type definitions
```

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** — build tool and dev server
- **React Router v6** — client-side routing
- **Zustand** — lightweight global state
- **Framer Motion** — animations
