# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 29: Spec UI Integration - Complete

- Feature 28: Spec Persistence & Download — Complete

- Feature 27: Spec Generation Flow (backend) — Complete

- Feature 26: AI Chat Functional — Complete

- Feature 25: Sidebar Chat Feed — Complete

- Feature 24: AI Presence State — Complete

- Feature 23: AI Design Agent Logic — Complete

- Feature 22: Design Agent API - Complete

- Feature 21: Canvas Autosave — Complete

## Current Goal

- Spec UI integration is complete. The AI sidebar Specs tab now lists, previews, and downloads generated specs.

## Completed

- `29-spec-ui-integration`: Wired generated specs into the existing AI sidebar Specs tab.
  - Replaced the static demo spec card in [components/editor/ai-sidebar.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/ai-sidebar.tsx) with a compact scrollable ProjectSpec list for the current project.
  - Added metadata loading from `/api/projects/{projectId}/specs`, showing `createdAt` and `filename`, with loading, empty, and error states.
  - Added a spec preview dialog using shadcn `Dialog`, `ScrollArea`, and `Button`; preview content is fetched through the secure spec endpoint and rendered as Markdown.
  - Added download actions on each list item and inside the modal, both using the existing download endpoint so the browser handles file download.
  - Follow-up fix: wired the `Generate Spec` button to `/api/ai/spec`, sends current canvas nodes/edges plus chat history, tracks the Trigger.dev run with the returned public token, and refreshes the list when generation completes.
  - Follow-up fix: added a canvas-to-sidebar browser event bridge for one-shot spec generation snapshots without adding global state.
  - Follow-up fix: improved spec metadata route error handling so load failures return a clear JSON error.
  - Added [app/api/projects/[projectId]/specs/route.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/app/api/projects/[projectId]/specs/route.ts) as the ProjectSpec metadata API required by the UI, scoped by Clerk auth and `getProjectWithAccess`; it returns metadata only and does not expose Blob URLs or spec content.
  - `npm run build` passes (TypeScript clean; specs metadata and download routes registered).

- `28-spec-persistence-download`: Persisted generated specs with Vercel Blob + Prisma and added a secure download route.
  - Added the `ProjectSpec` Prisma model in [prisma/models/project.prisma](file:///E:/vraj/Projects/aisysdesign/ghost-ai/prisma/models/project.prisma) (`id`, `projectId` relation to `Project` with cascade delete, `filePath`, `createdAt`, index on `projectId`, mapped to `project_specs`) and a `specs ProjectSpec[]` back-relation on `Project`. The model stores metadata only — spec content lives in Vercel Blob.
  - Added migration [20260619120000_add_project_specs](file:///E:/vraj/Projects/aisysdesign/ghost-ai/prisma/migrations/20260619120000_add_project_specs/migration.sql) for the `project_specs` table (PK, `project_id` index, cascade FK to `projects`).
  - Updated [trigger/generate-spec.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/trigger/generate-spec.ts) to persist after generation following the canvas metadata+blob pattern: creates a `ProjectSpec` row first (to key the blob path by its id), uploads the Markdown to Vercel Blob at `specs/{projectId}/{specId}.md` (`access: "private"`, `contentType: "text/markdown"`, no random suffix, overwrite allowed), then stores `blob.url` on `ProjectSpec.filePath`. The task now returns `{ spec, specId }`. Uses the server-resolved `projectId` already threaded through the task (no client-trusted id).
  - Created the download route [app/api/projects/[projectId]/specs/[specId]/download/route.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/app/api/projects/[projectId]/specs/[specId]/download/route.ts) (`GET`): authenticates via Clerk (401), verifies project access via `getProjectWithAccess` (403), verifies the `ProjectSpec` exists and belongs to the project via `findFirst({ id, projectId })` (404 — also 404 when `filePath` is empty), fetches the private blob with `get`, and returns the Markdown as a `text/markdown` attachment (`Content-Disposition: attachment; filename="spec-{id}.md"`). Blob URLs are never exposed to the client.
  - Scope respected: no frontend/UI, no spec content stored in Prisma, no Blob URLs returned without access checks, existing canvas persistence untouched.
  - `npm run build` passes (TypeScript clean; download route registered).

- `27-spec-generation-flow`: Implemented the backend flow for AI-powered Markdown spec generation — trigger route, token route, and Trigger.dev task.
  - Created [trigger/generate-spec.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/trigger/generate-spec.ts) with a `generateSpec` task (`id: "generate-spec"`) that accepts `projectId`, `roomId`, `chatHistory`, `nodes`, and `edges`, validates the payload with Zod (`GenerateSpecInputSchema` — canvas `nodes`/`edges` kept loose as `z.any()` to avoid touching the canvas data model; chat messages normalized to `role`/`sender`/`content`), generates a Markdown technical spec from the canvas graph + design conversation via Gemini (`gemini-2.5-flash` through `@ai-sdk/google`, `generateText`), updates run `metadata` (`status`/`message`) for realtime tracking, and returns `{ spec }` as plain Markdown. Errors set `status: "error"` metadata and rethrow so Trigger.dev retry/error handling applies.
  - Created [app/api/ai/spec/route.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/app/api/ai/spec/route.ts) (`POST`) — authenticates via Clerk (401), Zod-validates `roomId`/`chatHistory`/`nodes`/`edges` (400 on failure), resolves project access from the authenticated user + `roomId` via `getProjectWithAccess` (403 if denied), triggers `generate-spec` with the **server-resolved** `project.id` (no client-supplied `projectId` is accepted), persists a `TaskRun` for ownership, and returns `{ runId, publicToken }` (`202`) with a scoped read-only realtime token.
  - Created [app/api/ai/spec/token/route.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/app/api/ai/spec/token/route.ts) (`POST`) — authenticates via Clerk, Zod-validates `runId`, verifies the `TaskRun` belongs to the user (403 otherwise), and issues a Trigger.dev public token scoped to that run with `expirationTime: "1h"`.
  - Reused the existing `TaskRun` Prisma model (no schema changes), and the existing auth, Prisma, Trigger.dev, and Gemini patterns established by the design feature. No frontend, spec editor UI, or spec persistence added (out of scope for this unit).
  - `npm run build` passes (TypeScript clean; `/api/ai/spec` and `/api/ai/spec/token` routes registered).

- `26-ai-chat-functional`: Wired the AI sidebar so users can submit design prompts, track the AI run status in real time, and reflect AI-driven canvas updates through Liveblocks.
  - Extended [app/api/ai/design/route.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/app/api/ai/design/route.ts) to mint a scoped read-only Trigger.dev public token (`auth.createPublicToken` with `read.runs` for the new run) and return `{ runId, publicToken }` in the `202` response, so the client can subscribe without a second round-trip.
  - In [components/editor/ai-sidebar.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/ai-sidebar.tsx), on submit: push the user message to the collaborative `ai-chat` feed, `POST /api/ai/design` with `{ prompt, roomId, projectId }`, read `{ runId, publicToken }`, and store both in local state.
  - Subscribed to the run with `useRealtimeRun<typeof designAgentTask>(runId, { accessToken: publicToken, enabled })` from `@trigger.dev/react-hooks`; the subscription stays inert until a runId + token exist.
  - On run completion (`onComplete`), pushes a final assistant message to `ai-chat` (success copy, or an error message when the run failed/crashed/cancelled/timed out) and resets loading + run state.
  - Replaced the presence-transition completion detection with the realtime-run `onComplete`; the submitter pushes the outcome to the shared `ai-chat` feed so all collaborators see it.
  - Derived `isBusy = isLoading || isRunActive || isAiThinking` to disable the textarea, send button, and starter chips while a run is active (run-driven for the submitter, presence-driven for other collaborators).
  - Added a compact status strip above the input, shown only while busy: dark `bg-surface` base with a `#62C073` animated ping indicator and the latest `ai-status-feed` text (falling back to presence status / run status).
  - Restyled chat bubbles per spec — user messages use the `#62C073` green accent with dark `#08210f` text; assistant messages use a dark `bg-elevated` surface with light text.
  - Send button uses the `#62C073` green accent (enabled), dims when disabled, and shows a `Loader2` spinner while a run is active.
  - Errors (trigger failures or failed runs) surface as messages in the `ai-chat` feed; removed the separate inline `sendError` strip. Canvas updates remain fully Liveblocks-driven (no manual node/edge syncing).
  - `npm run build` passes (TypeScript clean).

- `25-sidebar-chat-feed`: Implemented real-time collaborative room chat in the AI sidebar using a separate Liveblocks `ai-chat` feed.
  - Added `AiChatMessageSchema` and `AiChatMessage` type in [types/tasks.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/types/tasks.ts) with `id`, `sender`, `role` (`user` | `assistant`), `content`, and `timestamp` fields, validated via Zod.
  - Registered `"ai-chat"` as a typed `LiveList<LiveObject<...>>` in the Liveblocks `Storage` declaration in [liveblocks.config.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/liveblocks.config.ts), kept separate from `"ai-status-feed"`.
  - Subscribed to `"ai-chat"` in [components/editor/ai-sidebar.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/ai-sidebar.tsx) via `useStorage` and validated each incoming entry against `AiChatMessageSchema` before rendering.
  - Added a `useMutation`-based `appendChatMessage` that lazily initialises the `LiveList` on first send and pushes a `LiveObject` containing the validated message shape.
  - Used `useSelf` to read the current user's display name (`info.name`) as the `sender` field so each message is attributed to its author.
  - Rendered messages in the chat area with sender name and HH:MM timestamp above each bubble; user bubbles are right-aligned, assistant bubbles left-aligned.
  - On send, the user message is pushed to `ai-chat` first; input is cleared on success.
  - Added a `sendError` state that surfaces inline below the status panel with an `AlertCircle` icon and clears when the user types again.
  - When the AI design agent finishes (thinking state flips), the confirmation or error reply is also pushed to `ai-chat` as an `assistant` message so all collaborators see the outcome.
  - `npm run build` passes.

- `24-ai-presence-state`: Implemented shared AI presence, thinking states, and collaborative AI status feeds.
  - Defined the status feed schema using Zod in [types/tasks.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/types/tasks.ts), including support for optional `text` fields.
  - Added the `"ai-status-feed"` key to the collaborative Liveblocks `Storage` type in [liveblocks.config.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/liveblocks.config.ts).
  - Subscribed to `"ai-status-feed"` in [components/editor/ai-sidebar.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/ai-sidebar.tsx) and validated incoming updates using Zod, displaying only the most recent validated status message.
  - Showed a small spinner status indicator in the sidebar when `isAiThinking` is active, and disabled the chat input and displayed a loading spinner on the send button while generation is active.
  - Updated the cursor name badges in [components/editor/canvas/collaborator-cursors.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/canvas/collaborator-cursors.tsx) to read the `thinking` state from presence and display a small spinner next to the collaborator's name when they are thinking.
  - Updated the background Trigger task in [trigger/design-agent.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/trigger/design-agent.ts) to clear and push status logs to both `statusFeed` and the new `"ai-status-feed"`.
  - `npm run build` compiled successfully.

- `23-design-agent-logic`: Implemented the full AI design agent task logic and client sidebar integration.
  - Completed the `designAgentTask` in [trigger/design-agent.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/trigger/design-agent.ts) to interpret user prompt via Gemini (`@ai-sdk/google`) using `generateObject` with `gemini-2.5-flash` (due to `gemini-1.5-flash` 404/deprecation on current API credentials) and schema validation.
  - Simulates active AI presence (cursor movements and status strings) sequentially across canvas nodes and edges during creation.
  - Mutates collaborative canvas storage (added `flow` property type definition in [liveblocks.config.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/liveblocks.config.ts) for safety) on the server using delta mutations.
  - Publishes real-time progress updates to a collaborative `statusFeed` in Liveblocks storage.
  - Restricts design output to approved shapes, color palettes, sizing rules, and connection handles.
  - Clears AI presence on success, and handles API/generation errors gracefully without breaking active collaboration.
  - Wired real-time status rendering, message logs, and start triggering inside [components/editor/ai-sidebar.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/ai-sidebar.tsx).
  - `npm run build` passes.

- `22-design-agent-api`: Implemented backend task wiring for design generation using Trigger.dev.
  - Added `TaskRun` to Prisma with `runId`, `projectId`, `userId`, `createdAt`, a unique run ID, an index on `runId`, and a compound index on `userId` and `projectId`.
  - Added migration `20260618180000_add_task_runs` for the `task_runs` table and regenerated Prisma Client.
  - Created [trigger/design-agent.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/trigger/design-agent.ts) with a minimal `design-agent` task that accepts `prompt` and `roomId`, logs the payload, and echoes it.
  - Added [app/api/ai/design/route.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/app/api/ai/design/route.ts) to authenticate users, validate `prompt`/`roomId`/`projectId`, verify project access, trigger the design task, persist a `TaskRun`, and return the run ID.
  - Added [app/api/ai/design/token/route.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/app/api/ai/design/token/route.ts) to verify TaskRun ownership and return a Trigger.dev public token scoped to the requested run.
  - `npx prisma validate` passes.
  - `npx prisma generate` passes.
  - `npm run build` passes.

- `21-canvas-autosave`: Implemented autosave and load for the collaborative canvas using Vercel Blob and Prisma.
  - Installed `@vercel/blob` to persist canvas JSON states.
  - Reused `canvasJsonPath` on the Prisma `Project` model to store the canvas state blob URL.
  - Added canvas REST API routes under [app/api/projects/[projectId]/canvas/route.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/app/api/projects/[projectId]/canvas/route.ts) with:
    - `PUT` route uploading canvas JSON to Vercel Blob and saving the URL on the Prisma project.
    - `GET` route reading the URL from Prisma, fetching JSON from Vercel Blob, and returning it.
    - Both routes authenticate with Clerk and check permissions using `getProjectWithAccess`.
  - Created [hooks/use-canvas-autosave.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/hooks/use-canvas-autosave.ts) which watches canvas node and edge changes, debounces saves for 2 seconds, and broadcasts status transitions (`saving`, `saved`, `error`, `idle`) via custom window events.
  - Updated [components/editor/canvas/canvas-flow.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/canvas/canvas-flow.tsx) to call the hook and load the saved canvas if the Liveblocks room has no existing nodes or edges, bypassing the load if active collaboration is present.
  - Handled post-load synchronization to prevent immediate redundant saves of unchanged canvas data on mount.
  - Added a Save button next to the Templates button in the editor workspace header [components/editor/editor-workspace-client.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/editor-workspace-client.tsx) that visually updates to show the save state and allows manual saves on click.
  - `npm run build` passes.

- `20-ai-sidebar-shell`: Implemented the AI Sidebar shell component inside the editor workspace.
  - Separated the AI sidebar into its own component [components/editor/ai-sidebar.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/ai-sidebar.tsx).
  - Kept the open/close state controlled by the parent component and preserved the floating slide-in animation from the right side.
  - Styled the sidebar using theme variables (`bg-base/95` background with backdrop blur and default border `border-surface-border`).
  - Added a sidebar header featuring a bot icon, title `AI Workspace`, subtitle `Collaborate with Ghost AI`, and close button aligned to the right.
  - Implemented a tabbed layout using shadcn `Tabs` containing the `AI Architect` and `Specs` tabs, with active tabs highlighted using accent background and primary text colors.
  - Built the `AI Architect` tab with a scrollable chat area, custom empty state layout featuring starter prompt chips, and custom styled user (`bg-brand-dim border-brand/50`) and assistant (`bg-elevated text-accent-text`) message styling.
  - Designed an auto-resizing text area input that submits on Enter and inserts a newline on Shift+Enter, restricted between 72px min height and 160px max height, with a send button styled with `bg-accent text-white`.
  - Built the `Specs` tab with a `Generate Spec` button and a static demo spec card featuring code snippet preview, spec metadata, and disabled download action.
  - Mapped semantic color alias utility classes (like `bg-base`, `bg-subtle`, `text-copy-primary`, etc.) inside the Tailwind theme config in `app/globals.css`.
  - `npm run build` passes.

- `19-presence-avatars-cursors`: Added real-time collaboration presence avatars and live cursors inside the editor canvas view.
  - Defined the shared presence type in [liveblocks.config.ts](file:///E:/vraj/Projects/aisysdesign/ghost-ai/liveblocks.config.ts) containing `cursor: { x: number; y: number } | null` and `thinking: boolean`.
  - Created [components/editor/canvas/presence-avatars.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/canvas/presence-avatars.tsx) which retrieves room participants using Liveblocks, filters the list to exclude entries matching the current Clerk user ID, renders active collaborators in an overlapping stack (up to five avatars with initials/image and presence color ring borders, plus a +N overflow chip), and displays the current Clerk `UserButton` next to them separated by a vertical divider when collaborators exist.
  - Created [components/editor/canvas/collaborator-cursors.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/canvas/collaborator-cursors.tsx) which translates collaborator flow coordinates to viewport screen space coordinates and renders custom colored mouse pointers with attached name badges.
  - Integrated cursor broadcasting inside [components/editor/canvas/canvas-flow.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/canvas/canvas-flow.tsx) using the `onMouseMove` and `onMouseLeave` React Flow event handlers to broadcast cursor coordinates and clear cursors.
  - Removed the redundant Clerk `UserButton` from [components/editor/editor-workspace-client.tsx](file:///E:/vraj/Projects/aisysdesign/ghost-ai/components/editor/editor-workspace-client.tsx) header to keep the canvas presence group as the single user identity point.
  - `npm run build` passes.

- `18-starter-templates`: Added a starter template library so users can quickly bootstrap a canvas with pre-built diagram layouts.
  - Created `components/editor/starter-templates.ts` containing the `CanvasTemplate` type and a `CANVAS_TEMPLATES` list containing three distinct templates: Microservices Architecture, CI/CD Pipeline, and Event-Driven System.
  - Created `components/editor/starter-templates-modal.tsx` which renders a dialog displaying the templates in a scrollable card grid.
  - Embedded a lightweight, responsive SVG preview into each template card that scales the diagram coordinates using SVG `viewBox` dynamically calculated from template node positions, rendering custom SVG shapes (rectangle, circle, pill, diamond, hexagon, cylinder) and simple lines between node centers.
  - Added a "Templates" button to the editor navbar layout in `components/editor/editor-workspace-client.tsx` that dispatches a custom window event `"open-starter-templates"`.
  - Wired a listener in `components/editor/canvas/canvas-flow.tsx` to display the modal and import templates by replacing the current canvas (clearing nodes/edges) and calling `fitView` after a render timeout.
  - `npm run build` passes.

- `17-canvas-ergonomics`: Added a floating pill-shaped control bar at the bottom-left of the canvas (`bottom-24 left-6`), sitting above the shape panel. It contains Zoom controls (zoom out, fit view, zoom in with smooth `150ms` transitions) and history controls (undo, redo using Liveblocks `useUndo`, `useRedo`, `useCanUndo`, and `useCanRedo` hooks). Kept disabled history buttons visually dimmed (`opacity-40`) and blocked all clicks/double-clicks/pointer events from propagating to the React Flow canvas using propagation prevention and `nodrag nopan nowheel` classes. Implemented `useKeyboardShortcuts` hook in `hooks/` to listen on `window` for `+`/`=` (zoom in), `-` (zoom out), `Cmd/Ctrl + Z` (undo), and `Cmd/Ctrl + Shift + Z` / `Cmd/Ctrl + Y` (redo) while bypassing shortcuts if an input, textarea, or editable text element is focused. `npm run build` passes.

- `16-edge-behavior`: Replaced default canvas edges with custom right-angle routing edges using `getSmoothStepPath` with rounded corners. Added dual source/target handles at all four sides of nodes styled as subtle small white dots with dark borders that fade in on node hover (using `group-hover` and `opacity-0` transitions). Styled edges to be dimmed at rest (`#505060`) and brighten when hovered or selected (`#c0c0cc` / `#3b82f6`). Created an interactive invisible thick path overlay (`strokeWidth={20}`) to make edges easier to click and hover. Configured React Flow's `defaultEdgeOptions` to automatically use the custom `canvasEdge` renderer and dynamically assign custom SVG arrowhead marker definitions (`arrow-rest`, `arrow-hover`, `arrow-selected`) based on active state. Added inline edge label editing on double-click with an auto-growing input (using a hidden mirror span for dynamic width layout) that saves the label to collaborative state on blur, Enter, or Escape (Escape reverts to previous label value), showing saved labels as glassmorphic pill badges with faint hint prompts when no label exists. Prevented label edits and clicks from dragging nodes or panning the canvas by stopping event propagation and applying `nodrag nopan nowheel` React Flow classes. `npm run build` passes.

- `15-node-color-toolbar`: Added a floating color toolbar above selected nodes so users can change both their background and text color directly on the canvas. Kept the toolbar slightly above the node without overlapping it (`bottom-full mb-3`). Created `NODE_COLORS` color palette pairs in `types/canvas.ts` containing neutral dark, blue, purple, orange, red, pink, green, and teal colors. Styled color swatches with hover glow matching their respective text color (`boxShadow` using text color at 50% opacity) and clear active indicator (blue ring with dark offset). Prevented toolbar interactions from dragging nodes or panning the canvas by applying `nodrag nopan nowheel` React Flow utility classes and stopping event propagation on click, pointer, and double-click events. Synchronized swatch selections immediately inside the collaborative canvas state. `npm run build` passes.


- `14-node-editing`: Implemented node resizing and inline label editing. Added `<NodeResizer />` to `CanvasNode` to show custom dark-themed resize handles when selected. Configured minimum width (50px) and minimum height (40px) limits for resizing. Enabled aspect-ratio lock (`keepAspectRatio`) specifically for circles to prevent handles misalignment. Added inline label editing by double-clicking a node's body. Renders an absolutely positioned `<textarea>` overlaying the label area to edit without layout shifts. Styled empty labels with a centered subtle placeholder ("Double-click to edit"). Prevented editor interactions from propagating to canvas panning/dragging or triggering canvas keyboard shortcuts by stopping event propagation for `keydown`, `pointerdown`, and `mousedown`, and applying standard React Flow helper classes (`nodrag`, `nopan`, `nowheel`) to the textarea. Wire-synced label edits and resizing directly to Liveblocks collaborative state. `npm run build` passes.

- `13-node-shape`: Replaced placeholder shape rendering in `CanvasNode` to utilize CSS styling for rectangle, pill, and circle, and custom SVGs for diamond, hexagon, and cylinder. Scaled SVGs dynamically using `vector-effect="non-scaling-stroke"` to keep border weights uniform at any dimension. Styled borders to be subtle at rest (using a semi-transparent version of the shape palette border) and brighter when selected (solid bright blue `#3b82f6` with an optional glow). Added custom HTML5 drag preview ghost inside `ShapeToolbar`'s `onDragStart` handler that constructs an off-screen element matching the dragged shape type, color, and default size, setting it as the drag image centered at the cursor position. The preview automatically disappears when dropped or cancelled. `npm run build` passes.

- `12-shape-panel`: Floating glassmorphic pill-shaped `ShapeToolbar` added at the bottom-center of the canvas. Added draggable buttons for rectangle, diamond, circle, pill, cylinder, and hexagon, carrying the shape name and sensible default dimensions in the drag payload. Wired HTML5 `dragover` and `drop` handling to the canvas wrapper to convert cursor screen coordinates to React Flow canvas coordinates, creating a new node centered at that position with an empty label, default shape color, and custom `CanvasNode` node type. Generated unique node IDs using the `${shape}-${timestamp}-${counter}` pattern. Implemented custom `CanvasNode` rendering for each shape type (rounded HTML for rectangle, circle, and pill; custom scaling SVGs for diamond, hexagon, and cylinder). Wired distinct background and border color palettes (Indigo, Emerald, Amber, Rose, Sky, and Violet) to make shapes visually distinguishable. Configured dual overlapping handles (source and target) with unique IDs at all four sides (Top, Bottom, Left, Right) to enable any-to-any connections. Changed connection lines, selection states, and handles to a professional blue theme (`#3b82f6`). `npm run build` passes.

- `01-design-system`: shadcn/ui installed and configured, all 7 UI primitives added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), `lib/utils.ts` with `cn()` created, `globals.css` dark theme tokens wired.
- `02-editor-chrome`: `EditorNavbar` and `ProjectSidebar` shell components created. Navbar is fixed-height with sidebar toggle (PanelLeftOpen/PanelLeftClose). Sidebar floats above canvas, slides in from left, has Projects header + close button, My Projects / Shared tabs with empty states, and full-width New Project button. `app/editor/page.tsx` wired to demo the chrome. Dialog color tokens already in place from Feature 01.
- `04-project-dialogs`: Editor home screen with heading, description, and New Project button. `useProjectDialogs` hook manages dialog/form/loading state. Create Project dialog with live slug preview. Rename Project dialog (prefilled, auto-focus, Enter submits). Delete Project dialog (destructive confirm). Sidebar updated with per-project rename/delete actions visible on hover (owned projects only); shared tab hides actions. Mobile backdrop scrim added. Mock project data in `lib/mock-projects.ts`. No API calls.
- `03-auth`: `@clerk/ui` installed. `ClerkProvider` wraps `<body>` in root layout with `dark` theme and CSS variable overrides. `proxy.ts` at root uses `clerkMiddleware` + `createRouteMatcher` to protect all routes except `/sign-in` and `/sign-up`. Sign-in and sign-up pages at `app/sign-in/[[...sign-in]]/` and `app/sign-up/[[...sign-up]]/` — two-panel layout on large screens (logo/tagline/feature list left, Clerk form right), form-only on small screens. `app/page.tsx` is a server component that redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`. `UserButton` added to editor navbar right section. `npm run build` passes.
- `05-prisma`: Multi-file Prisma schema under `prisma/models/` (`base.prisma` for generator/datasource, `project.prisma` for models). `Project` model with ownerId (Clerk), name, optional description, `ProjectStatus` enum (DRAFT/ARCHIVED), `canvasJsonPath`, timestamps, indexes on ownerId and createdAt. `ProjectCollaborator` with cascade-delete project relation, email, createdAt, unique constraint on project/email, indexes on email and project/date. `lib/prisma.ts` cached singleton: branches on `prisma+postgres://` prefix to use Accelerate (`accelerateUrl` + `withAccelerate`), otherwise uses `PrismaPg` adapter. `prisma.config.ts` updated to load `.env.local` and point schema at `prisma/models`. Migration `init_projects` applied to Prisma Postgres. `npm run build` passes.
- `06-project-apis`: REST project CRUD routes created at `app/api/projects/route.ts` (`GET` list + `POST` create) and `app/api/projects/[projectId]/route.ts` (`PATCH` rename + `DELETE` delete). All routes use Clerk `auth()` server-side; unauthenticated requests return 401. `POST` defaults missing name to "Untitled Project" and uses Prisma's cuid ID strategy. `PATCH` and `DELETE` enforce owner-only access — non-owner returns 403, project not found returns 404. No UI wiring. `npm run build` passes.
- `07-wire-editor-home`: `app/editor/page.tsx` converted to async server component — fetches owned and shared projects via `lib/data/projects.ts` (`getOwnedProjects` + `getSharedProjects` using Prisma + Clerk auth). `useProjectDialogs` replaced by `hooks/use-project-actions.ts` with real `fetch` calls: create (POST with client-generated room ID = slug + suffix, navigates to `/editor/[id]`), rename (PATCH, refreshes), delete (DELETE, redirects to `/editor` if active workspace, else refreshes). `POST /api/projects` updated to accept optional explicit `id` so project ID and Liveblocks room ID stay aligned. `ProjectSidebar` updated to take `ownedProjects`/`sharedProjects` props instead of mock data. Client-side logic extracted to `components/editor/editor-home-client.tsx`. `npm run build` passes.
- `09-share-dialog`: Collaborator REST APIs added under `app/api/projects/[projectId]/collaborators/` — `route.ts` (`GET` list, accessible to owner or collaborator via `getProjectWithAccess`; `POST` invite, owner-only, validates email + upserts on the `projectId_email` unique key) and `[collaboratorId]/route.ts` (`DELETE` remove, owner-only via `deleteMany` scoped to project). `lib/data/collaborators.ts` exports `Collaborator` type + `enrichCollaborators()` which batch-calls Clerk Backend `users.getUserList({ emailAddress })`, maps users by lowercased email, and returns display name (`fullName` → first/last → null) + `imageUrl`, falling back to email-only when no Clerk user matches. `hooks/use-share-dialog.ts` manages dialog open state, list loading on open, optimistic invite/remove, invite error surfacing, and per-row removing state. `components/editor/share-dialog.tsx` renders the dialog: owners get an email invite field (Enter submits), inline error, collaborator list with avatar/initials + remove buttons, and a footer "Copy link" button with temporary `Copied!` feedback via `navigator.clipboard`; collaborators get the read-only list (no invite/remove/copy). `editor-workspace-client.tsx` Share button enabled (`onClick` opens dialog) and `ShareDialog` wired via the hook; new `isOwner` prop threaded through. `app/editor/[roomId]/page.tsx` passes `isOwner={project.ownerId === userId}`. No local user table. `npm run build` passes.
- `10-liveblocks-setup`: `liveblocks.config.ts` updated with `Presence` (`cursor: {x,y}|null`, `isThinking: boolean`) and `UserMeta` (`id`, `info: {name, avatar, color}`). `lib/liveblocks.ts` added with `getLiveblocks()` lazy-cached singleton (avoids build-time secret validation) and `getUserColor(userId)` deterministic hash over a 10-color palette. `@liveblocks/node` installed. `POST /api/liveblocks-auth` created — requires Clerk auth (401 if missing), verifies project access via `getProjectWithAccess` (403 if denied), calls `getOrCreateRoom` with `defaultAccesses: []`, then `identifyUser` with `name`/`avatar`/`color` from Clerk. `npm run build` passes.
- `08-editor-workspace-shell`: `app/editor/[roomId]/page.tsx` added as async server component — checks auth (redirect to `/sign-in` if unauthenticated), checks project access via `lib/project-access.ts` (shows `AccessDenied` for missing or unauthorized projects), fetches all projects for sidebar, renders `EditorWorkspaceClient`. `lib/project-access.ts` added with `getCurrentIdentity` (userId + primary email) and `getProjectWithAccess` (owner or collaborator check). `components/editor/access-denied.tsx` added with centered layout, lock icon, short message, and link back to `/editor`. `components/editor/editor-workspace-client.tsx` added: workspace navbar with project name, disabled Share button placeholder, AI sidebar toggle, and UserButton; existing `ProjectSidebar` on left (open by default, active project highlighted); dark canvas placeholder filling remaining space; right AI sidebar placeholder. `ProjectSidebar` updated to accept optional `activeProjectId` prop — active item receives `bg-bg-subtle` highlight. `npm run build` passes.
- `11-base-canvas`: Canvas placeholder replaced with Liveblocks-backed React Flow canvas. `types/canvas.ts` added with `NodeData` (label, color, shape), `CanvasNodeType`, and `CanvasEdgeType`. `components/editor/canvas/canvas-wrapper.tsx` sets up `LiveblocksProvider` (authEndpoint `/api/liveblocks-auth`), `RoomProvider` (room = project ID, initialPresence cursor null + isThinking false), class-based `CanvasErrorBoundary`, and `ClientSideSuspense` loading state. `components/editor/canvas/canvas-flow.tsx` uses `useLiveblocksFlow` (suspense, empty initial nodes/edges), renders `ReactFlow` with `ConnectionMode.Loose`, `fitView`, `MiniMap`, and dot-pattern `Background`. `editor-workspace-client.tsx` updated to render `CanvasWrapper` instead of the placeholder. `npm run build` passes.

## In Progress


## Next Up

- Feature 30 (TBD)

## Open Questions

- None.

## Architecture Decisions

- Dark-only theme: all color tokens defined as CSS custom properties in `globals.css`, mapped via Tailwind v4 `@theme inline` to Tailwind utility classes.
- shadcn semantic tokens (`--background`, `--foreground`, `--primary`, etc.) point directly to the project's dark palette — no `.dark` class needed.
- shadcn/ui components installed via CLI into `components/ui/` — not to be modified post-install.
- Editor chrome sidebar state is owned by the parent page/layout and passed as props (`isSidebarOpen` / `onSidebarToggle` to navbar, `isOpen` / `onClose` to sidebar) — keeps both components stateless and composable.

## Session Notes

- Stack: Next.js 16.2.9, React 19, Tailwind CSS v4 (configured via CSS, no `tailwind.config.js`).
- shadcn/ui v4.11.0 initialized with Tailwind v4 CSS variable approach.
- `lib/utils.ts` exports `cn()` using `clsx` + `tailwind-merge`.

