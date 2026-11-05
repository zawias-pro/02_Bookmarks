# Agent Instructions

## Commands

- Install dependencies with `npm install`.
- Run the frontend development server with `npm run dev`; it serves `http://localhost:5177`.
- Run verification with `npm run lint && npm test && npm run build`; `build` runs `tsc -b` before `vite build`.
- Run the production server with `npm run preview`, normally after `npm run build`.
- Start PocketBase with `podman compose up -d --build`; its API is at `http://127.0.0.1:8090/api`.
- Fill the local PocketBase with throwaway categories and bookmarks with `npm run seed:dev`; it prints the account to sign in with and `npm run seed:dev -- --clean` removes the account and its records. Sign in from a private window, because the app's IndexedDB is shared with real data.
- Run the complete local stack with `podman compose up`; Vite is at `http://localhost:5177` and PocketBase is at `http://localhost:8090`.

## Runtime Setup

- `pb_data/` is local PocketBase runtime data and is intentionally ignored; schema changes belong in `pb_migrations/` and `pb_schema.json`.
- `pb_hooks/` holds PocketBase JSVM code baked into the PocketBase image. Each handler runs in an isolated scope, so a file-level helper is undefined inside it: share helpers through a CommonJS module loaded with `require`. Use `.cjs` because `package.json` marks this repo as an ESM package while PocketBase loads plain files as CommonJS.
- Production `installation/compose.yml` pulls the published GHCR images. PocketBase migrations are baked into the PocketBase image, so production no longer mounts `pb_migrations`.
- Automated tests are `node --test` files next to the code they cover (for example `src/bookmarks/BookmarkList/layout.test.ts`); they run on Node's built-in runner with no dependency. `tsconfig.test.json` ships ES2023 plus node types and no DOM, so logic a test imports must not touch DOM globals: keep it in its own module (`src/icons/declared.ts`) and leave DOM work in the sibling. Lint and build remain the other checks. `.github/workflows/publish.yml` runs `npm run lint` and publishes both `linux/amd64` container images to GHCR when a semantic version tag such as `1.2.3` is pushed; image tags are exactly that version and there are no floating tags.

## Architecture

- `src/main.tsx` mounts the React app and wraps it in `NetworkProvider`; `src/App.tsx` composes the page.
- PocketBase access is centralized in `src/lib/pocketbase.ts`; do not create additional SDK instances in components.
- Dexie in `src/lib/database.ts` is the source of truth for local bookmarks; local edits must work offline.
- Dexie categories are local-first too; `src/core/Sidebar/Sidebar.tsx` owns category creation and filtering.
- Categories form a tree: `parentId` (`null` at top level) and `order` within their parent, at most three levels deep. The sidebar renders it flat with indents, and `src/categories/tree.ts` holds the pure tree, move and delete planning.
- Both drag surfaces use `@dnd-kit/core` in edit mode: the sidebar drags category rows with before/inside/after zones, the board drags bookmarks onto empty grid slots. Keep new drag rules in those two components, not in a shared hook.
- Every bookmark belongs to exactly one category (`categoryId`); there are no uncategorized bookmarks and the PocketBase field is required.
- Every category owns its board layout in `positions` (bookmark id to grid slot); empty slots are intentional gaps, never compacted.
- There is no all-bookmarks view: the sidebar lists categories and the first row is selected on every app open; the selection is not persisted.
- `pb_hooks/users.pb.js` gives every new account one category named "Unnamed"; clients never invent a category, so a fresh signed-out install has none until one is added.
- A category can be deleted only when it is not the last one and holds no bookmarks; `deleteCategory` throws, and the form shows the message as a toast. Its sub-categories take its place among its siblings.
- `src/sync/sync.ts` contains the explicit force pull/push PocketBase synchronization for bookmarks and categories. One record the server refuses with a 400 stays pending and is reported once; a transport failure still fails the whole sync.
- Bookmark icons resolve in `src/icons/resolve.ts`: the browser first checks it can reach the site at all, then the PocketBase route in `pb_hooks/icon-proxy.pb.js` streams the page so the declared `<link rel="icon">` is parsed in `src/icons/declared.ts`, and `pb_hooks/icon-probe.pb.js` tries the candidate URLs in one request and streams the first image. Both routes need a session and refuse private hosts, and there is no third-party icon CDN. Bytes pass `src/icons/image.ts` before storage: undecodable bytes are dropped, an SVG without `xmlns` gets it added, and a type or size the file fields refuse is rasterised to PNG, so a bookmark leaves the browser storable. A record saved before that gate still gets its icon rasterised once on sync (`src/icons/rejected.ts`) instead of blocking the queue. An upload lives in the synced `icons` library (`src/icons/library.ts`) and pins the bookmark with `iconSource: 'custom'`, which bulk reloads never overwrite.
- `NetworkContext` uses browser online/offline events to disable remote sync controls only.
- The PWA service worker is generated only by `npm run build`; `npm run dev` is not an offline/PWA test environment.
- To test offline PWA behavior, build and run `npm run preview`, visit the app online until the service worker activates, then disconnect and reload.

## Code Conventions

- Oxlint enforces no default exports with `import/no-default-export` and requires function expressions with `func-style`; use arrow functions and named export lists at the end of modules.
- Components use direct inline prop types rather than `React.FC` or separate component prop interfaces.
- TypeScript is strict about unused locals and parameters; keep `tsc -b` passing.
- Avoid defensive code that silently ignores unexpected states. If an invariant is violated, throw an error or surface it explicitly instead of returning early. For example, `deleteTag` should throw when no tag is selected rather than silently doing nothing. This applies throughout the codebase; reserve early returns for expected user input validation and deliberate cancellation.
