# Agent Instructions

## Commands

- Install dependencies with `npm install`.
- Run the frontend development server with `npm run dev`; it serves `http://localhost:5173`.
- Run verification with `npm run lint && npm run build`; `build` runs `tsc -b` before `vite build`.
- Run the production server with `npm run preview`, normally after `npm run build`.
- Start PocketBase with `docker compose up -d --build`; its API is at `http://127.0.0.1:8090/api`.
- Run the complete local stack with `docker compose up`; Vite is at `http://localhost:5173` and PocketBase is at `http://localhost:8090`.

## Runtime Setup

- Copy `.env.dist` to `.env` when needed; `VITE_POCKETBASE_URL` controls the frontend PocketBase URL.
- `pb_data/` is local PocketBase runtime data and is intentionally ignored; schema changes belong in `pb_migrations/` and `pb_schema.json`.
- There are no automated tests or CI workflows in this repository; lint and build are the available checks.

## Architecture

- `src/main.tsx` mounts the React app and wraps it in `NetworkProvider`; `src/App.tsx` composes the page.
- PocketBase access is centralized in `src/lib/pocketbase.ts`; do not create additional SDK instances in components.
- Dexie in `src/lib/database.ts` is the source of truth for local bookmarks; local edits must work offline.
- `src/lib/sync.ts` contains the explicit force pull/push PocketBase synchronization.
- `NetworkContext` uses browser online/offline events to disable remote sync controls only.
- The PWA service worker is generated only by `npm run build`; `npm run dev` is not an offline/PWA test environment.
- To test offline PWA behavior, build and run `npm run preview`, visit the app online until the service worker activates, then disconnect and reload.

## Code Conventions

- Oxlint enforces no default exports with `import/no-default-export` and requires function expressions with `func-style`; use arrow functions and named export lists at the end of modules.
- Components use direct inline prop types rather than `React.FC` or separate component prop interfaces.
- TypeScript is strict about unused locals and parameters; keep `tsc -b` passing.
