# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 03: Auth — Complete

## Current Goal

- Define the immediate implementation goal here.

## Completed

- `01-design-system`: shadcn/ui installed and configured, all 7 UI primitives added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), `lib/utils.ts` with `cn()` created, `globals.css` dark theme tokens wired.
- `02-editor-chrome`: `EditorNavbar` and `ProjectSidebar` shell components created. Navbar is fixed-height with sidebar toggle (PanelLeftOpen/PanelLeftClose). Sidebar floats above canvas, slides in from left, has Projects header + close button, My Projects / Shared tabs with empty states, and full-width New Project button. `app/editor/page.tsx` wired to demo the chrome. Dialog color tokens already in place from Feature 01.
- `03-auth`: `@clerk/ui` installed. `ClerkProvider` wraps `<body>` in root layout with `dark` theme and CSS variable overrides. `proxy.ts` at root uses `clerkMiddleware` + `createRouteMatcher` to protect all routes except `/sign-in` and `/sign-up`. Sign-in and sign-up pages at `app/sign-in/[[...sign-in]]/` and `app/sign-up/[[...sign-up]]/` — two-panel layout on large screens (logo/tagline/feature list left, Clerk form right), form-only on small screens. `app/page.tsx` is a server component that redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`. `UserButton` added to editor navbar right section. `npm run build` passes.

## In Progress

- None.

## Next Up

- Feature 04 (TBD)

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
