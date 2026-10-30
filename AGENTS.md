# Agent Instructions

## Commands

- Install dependencies with `npm install`.
- Run the frontend development server with `npm run dev`; it serves `http://localhost:5177`.
- Run verification with `npm run lint && npm test && npm run build`; `build` runs `tsc -b` before `vite build`.
- Run the production server with `npm run preview`, normally after `npm run build`.
- Start PocketBase with `podman compose up -d --build`; its API is at `http://127.0.0.1:8090/api`.
- Run the complete local stack with `podman compose up`; Vite is at `http://localhost:5177` and PocketBase is at `http://localhost:8090`.

## Runtime Setup

- `pb_data/` is local PocketBase runtime data and is intentionally ignored; schema changes belong in `pb_migrations/` and `pb_schema.json`.
- Production `installation/compose.yml` pulls the published GHCR images. PocketBase migrations are baked into the PocketBase image, so production no longer mounts `pb_migrations`.
- Automated tests are `node --test` files next to the code they cover (for example `src/bookmarks/BookmarkList/layout.test.ts`); they run on Node's built-in runner with no dependency. Lint and build remain the other checks. `.github/workflows/publish.yml` runs `npm run lint` and publishes both `linux/amd64` container images to GHCR when a semantic version tag such as `1.2.3` is pushed; image tags are exactly that version and there are no floating tags.

## Architecture

- `src/main.tsx` mounts the React app and wraps it in `NetworkProvider`; `src/App.tsx` composes the page.
- PocketBase access is centralized in `src/lib/pocketbase.ts`; do not create additional SDK instances in components.
- Dexie in `src/lib/database.ts` is the source of truth for local bookmarks; local edits must work offline.
- Dexie categories are local-first too; `src/core/Sidebar/Sidebar.tsx` owns category creation and filtering.
- Categories form a tree: `parentId` (`null` at top level) and `order` within their parent, at most three levels deep. The sidebar renders it flat with indents, and `src/categories/tree.ts` holds the pure tree, move and delete planning.
- Both drag surfaces use `@dnd-kit/core` in edit mode: the sidebar drags category rows with before/inside/after zones, the board drags bookmarks onto empty grid slots. Keep new drag rules in those two components, not in a shared hook.
- A bookmark belongs to at most one category (`categoryId`, `null` when uncategorized); there are no multi-category bookmarks.
- Every category owns its board layout in `positions` (bookmark id to grid slot); the uncategorized board is a hidden category record with a fixed id, and empty slots are intentional gaps, never compacted.
- There is no all-bookmarks view: the sidebar lists Uncategorized plus categories, and the selected view persists in localStorage.
- `src/sync/sync.ts` contains the explicit force pull/push PocketBase synchronization for bookmarks and categories.
- `NetworkContext` uses browser online/offline events to disable remote sync controls only.
- The PWA service worker is generated only by `npm run build`; `npm run dev` is not an offline/PWA test environment.
- To test offline PWA behavior, build and run `npm run preview`, visit the app online until the service worker activates, then disconnect and reload.

## Code Conventions

- Oxlint enforces no default exports with `import/no-default-export` and requires function expressions with `func-style`; use arrow functions and named export lists at the end of modules.
- Components use direct inline prop types rather than `React.FC` or separate component prop interfaces.
- TypeScript is strict about unused locals and parameters; keep `tsc -b` passing.
- Avoid defensive code that silently ignores unexpected states. If an invariant is violated, throw an error or surface it explicitly instead of returning early. For example, `deleteTag` should throw when no tag is selected rather than silently doing nothing. This applies throughout the codebase; reserve early returns for expected user input validation and deliberate cancellation.
