# Sway Internal Monorepo

A high-performance TypeScript monorepo with **separate Vercel deployments** for maximum iteration speed.

## 🏗️ Architecture

- **Frontend**: React SPA built with Vite → `apps/web`
- **Backend**: Hono Edge functions → `apps/edge-api`
- **Type Safety**: End-to-end types with tRPC
- **Build System**: Turborepo with intelligent caching
- **Deployment**: Two separate Vercel projects for optimal performance

## 📁 Structure

```
repo/
├── package.json                 # Root workspace + Turborepo
├── turbo.json                   # Turborepo pipeline config
├── bun.lock                     # pnpm lock file
├── tsconfig.base.json          # Base TypeScript config
├── DEPLOYMENT.md               # Detailed deployment guide
├── apps/
│   ├── web/                    # Vite React SPA
│   │   ├── src/
│   │   │   ├── main.tsx        # App entry + tRPC setup
│   │   │   ├── App.tsx         # Main component using tRPC
│   │   │   └── lib/trpc.ts     # tRPC client config
│   │   ├── vercel.json         # Web project Vercel config
│   │   └── package.json
│   └── edge-api/               # Vercel Edge Functions
│       ├── api/
│       │   ├── health.ts       # Health check endpoint
│       │   └── [[...trpc]].ts  # tRPC API handler
│       ├── src/
│       │   ├── hono.ts         # Hono app + tRPC adapter
│       │   └── routers/
│       │       ├── _app.ts     # Main router
│       │       └── info.ts # Example procedures
│       ├── vercel.json         # API project Vercel config
│       └── package.json
└── packages/
    └── trpc/                   # Shared tRPC utilities
        ├── src/
        │   ├── client.ts       # Client-side tRPC setup
        │   ├── server.ts       # Server-side tRPC setup
        │   └── types.ts        # Shared types
        └── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js ≥18
- pnpm ≥1.0
- Vercel CLI: `npm i -g vercel@latest`

### Installation & Development

```bash
# Install dependencies
pnpm install

# Start development (both projects)
pnpm dev

# Or start individually:
pnpm dev:web    # Frontend only
pnpm dev:api    # API only
```

This runs:
- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend**: `http://localhost:8787` (Vercel dev server)

