<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
</p>

# 👻 Ghost AI

**AI-Powered Collaborative System Design Canvas**

Ghost AI is a real-time collaborative platform for designing complex system architectures visually. Users can drag-and-drop architectural components onto an interactive canvas, connect them to define relationships, and leverage AI agents to auto-generate technical specifications, evaluate design quality, and receive actionable improvement recommendations — all in real time with their team.

---

## ✨ Features

### 🎨 Visual System Design Canvas
- **Interactive drag-and-drop canvas** powered by [React Flow](https://reactflow.dev/) for building system architecture diagrams
- **12+ component types** including services, databases, queues, load balancers, caches, API gateways, CDNs, storage, auth providers, monitoring systems, message brokers, and containers
- **Custom node rendering** with icons, labels, descriptions, and connection handles
- **Canvas toolbar** with a categorized palette of architectural building blocks
- **Keyboard shortcuts** — Delete nodes, Ctrl+Z/Y for undo/redo, Ctrl+S for manual save
- **Auto-save** with debounced persistence (2-second delay) to prevent data loss

### 🤖 AI-Powered Analysis & Generation
- **Design Agent** — An AI agent that performs multi-pass architecture analysis:
  - Architecture pattern classification and scoring
  - Scalability, security, reliability, and maintainability evaluation
  - Critical issue detection (single points of failure, bottlenecks, security gaps)
  - Prioritized optimization recommendations with effort estimates
  - Phased implementation roadmap generation
- **Spec Generation** — One-click generation of comprehensive technical specification documents covering:
  - System overview and component descriptions
  - Data flow and API specifications
  - Scaling strategy, security posture, and monitoring plan
  - Deployment architecture and CI/CD recommendations
- **AI Chat Assistant** — Context-aware chat that understands your current canvas design and answers architectural questions in real time

### 👥 Real-Time Collaboration
- **Live cursors** — See where your teammates are on the canvas in real time
- **Multi-user presence** powered by [Liveblocks](https://liveblocks.io/)
- **Room-based collaboration** — Each project has its own collaborative room
- **Role-based sharing** — Invite collaborators as Viewers or Editors by email

### 🔐 Authentication & Authorization
- Secure authentication via [Clerk](https://clerk.com/) with sign-in/sign-up flows
- Webhook-based user sync to the database
- Per-project access control with owner and shared-user roles
- Protected API routes and middleware-level route guarding

### 📁 Project Management
- Create, rename, and delete (soft-delete) projects
- Project listing with search and filtering
- Share projects with team members by email
- Persistent canvas state stored in the database

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────────┐ │
│  │  Canvas   │  │  Sidebar  │  │      AI Panel         │ │
│  │(React Flow│  │ (Projects)│  │ (Chat + Analysis +    │ │
│  │+ Liveblocks)│ │          │  │  Spec Generation)     │ │
│  └────┬─────┘  └─────┬─────┘  └──────────┬────────────┘ │
└───────┼──────────────┼──────────────────┼───────────────┘
        │              │                  │
        ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                  Next.js API Routes                      │
│  /api/liveblocks-auth  /api/projects  /api/chat         │
│  /api/webhooks/clerk   /api/projects/[id]/share          │
│  /api/trigger/[...trigger]                               │
└───────┬──────────────┬──────────────────┬───────────────┘
        │              │                  │
   ┌────▼────┐   ┌─────▼─────┐    ┌──────▼──────┐
   │Liveblocks│   │PostgreSQL │    │ Trigger.dev │
   │(Realtime)│   │ (Prisma)  │    │(Background) │
   └─────────┘   └───────────┘    └──────┬──────┘
                                         │
                                  ┌──────▼──────┐
                                  │  Gemini AI  │
                                  │(Google 2.5  │
                                  │   Flash)    │
                                  └──────┬──────┘
                                         │
                                  ┌──────▼──────┐
                                  │ Vercel Blob │
                                  │  (Storage)  │
                                  └─────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router) | 16.2.9 |
| **UI Library** | [React](https://react.dev/) | 19.2.4 |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | 5.x |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | 4.x |
| **Icons** | [Lucide React](https://lucide.dev/) | 1.20.0 |
| **Auth** | [Clerk](https://clerk.com/) (`@clerk/nextjs`) | 7.5.3 |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [Prisma](https://www.prisma.io/) | 7.8.0 |
| **Realtime** | [Liveblocks](https://liveblocks.io/) | 3.20.0 |
| **Canvas** | [React Flow](https://reactflow.dev/) (`@xyflow/react`) | 12.11.0 |
| **AI** | [Google Gemini](https://ai.google.dev/) via [Vercel AI SDK](https://sdk.vercel.ai/) | 6.x |
| **Background Jobs** | [Trigger.dev](https://trigger.dev/) | 4.4.6 |
| **File Storage** | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | 2.4.1 |

---

## 📂 Project Structure

```
ghost-ai/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── chat/                 # AI chat endpoint (streaming)
│   │   ├── liveblocks-auth/      # Liveblocks room authentication
│   │   ├── projects/             # Project CRUD + sharing
│   │   │   └── [id]/
│   │   │       └── share/        # Project sharing endpoint
│   │   ├── trigger/              # Trigger.dev webhook handler
│   │   └── webhooks/
│   │       └── clerk/            # Clerk user sync webhook
│   ├── editor/                   # Editor page (canvas + sidebar)
│   │   └── [projectId]/          # Project-specific editor view
│   ├── generated/                # Generated specs dashboard
│   ├── sign-in/                  # Clerk sign-in page
│   ├── sign-up/                  # Clerk sign-up page
│   ├── layout.tsx                # Root layout with Clerk & Liveblocks providers
│   ├── page.tsx                  # Landing / home page
│   └── globals.css               # Global styles & Tailwind config
│
├── components/
│   ├── auth/                     # Authentication overlay components
│   ├── editor/                   # Canvas editor components
│   │   ├── AiPanel.tsx           # Combined AI panel (chat + analysis + specs)
│   │   ├── CanvasToolbar.tsx     # Node palette for drag-and-drop
│   │   ├── ChatPanel.tsx         # AI chat assistant panel
│   │   ├── DesignAnalysisPanel.tsx # AI analysis results display
│   │   ├── EditorHeader.tsx      # Editor top bar
│   │   ├── InviteOverlay.tsx     # Collaboration invite UI
│   │   ├── ProjectSidebar.tsx    # Project list and management
│   │   ├── ShareDialog.tsx       # Share project dialog
│   │   ├── SpecGenerationPanel.tsx # Spec generation controls
│   │   └── SystemDesignNode.tsx  # Custom React Flow node component
│   └── ui/                       # shadcn/ui component library
│       ├── avatar, badge, button, card, dialog, dropdown-menu,
│       │   input, label, scroll-area, select, separator, sheet,
│       │   sidebar, skeleton, tabs, textarea, tooltip
│       └── ...
│
├── context/                      # Project context & documentation
│   ├── project-overview.md       # Project overview & goals
│   ├── architecture-context.md   # Architecture decisions
│   ├── ui-context.md             # UI design guidelines
│   ├── code-standards.md         # Coding standards
│   ├── ai-workflow-rules.md      # AI workflow rules
│   └── progress-tracker.md       # Development progress
│
├── hooks/                        # Custom React hooks
│   ├── use-canvas-autosave.ts    # Debounced canvas auto-save
│   ├── use-project-actions.ts    # Project CRUD operations
│   ├── use-project-dialogs.ts    # Dialog state management
│   ├── use-share-dialog.ts       # Share dialog logic
│   └── useKeyboardShortcuts.ts   # Canvas keyboard shortcuts
│
├── lib/                          # Utility libraries
│   ├── data/                     # Data access layer
│   ├── liveblocks.ts             # Liveblocks client configuration
│   ├── prisma.ts                 # Prisma client singleton
│   ├── project-access.ts         # Project authorization helpers
│   ├── mock-projects.ts          # Mock data for development
│   └── utils.ts                  # General utilities (cn helper)
│
├── prisma/
│   ├── schema.prisma             # Prisma schema entry point
│   ├── models/                   # Multi-file Prisma models
│   │   ├── user.prisma           # User model
│   │   ├── project.prisma        # Project model
│   │   └── project-share.prisma  # ProjectShare model
│   └── migrations/               # Database migrations
│
├── trigger/                      # Trigger.dev background tasks
│   ├── design-agent.ts           # AI design analysis agent
│   └── generate-spec.ts          # Technical spec generation
│
├── types/                        # TypeScript type definitions
│   ├── canvas.ts                 # Canvas node & edge types
│   └── tasks.ts                  # Trigger.dev task types
│
├── liveblocks.config.ts          # Liveblocks type configuration
├── trigger.config.ts             # Trigger.dev configuration
├── prisma.config.ts              # Prisma multi-file schema config
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies & scripts
└── .env / .env.local             # Environment variables
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) database (or a cloud-hosted instance like [Neon](https://neon.tech/) / [Supabase](https://supabase.com/))
- [Clerk](https://clerk.com/) account
- [Liveblocks](https://liveblocks.io/) account
- [Google AI Studio](https://aistudio.google.com/) API key (Gemini)
- [Vercel](https://vercel.com/) account (for Blob storage)
- [Trigger.dev](https://trigger.dev/) account (for background jobs)

### 1. Clone the Repository

```bash
git clone https://github.com/VrajVaghela/ghost_ai.git
cd ghost_ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
TRIGGER_SECRET_KEY="tr_dev_..."
```

Create a `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Liveblocks (Real-time Collaboration)
LIVEBLOCKS_SECRET_KEY="sk_dev_..."

# Google Gemini AI
GEMINI_API_KEY="..."
GOOGLE_GENERATIVE_AI_API_KEY="..."

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# Trigger.dev
TRIGGER_SECRET_KEY="tr_dev_..."
```

### 4. Set Up the Database

```bash
npx prisma generate
npx prisma db push
```

Or to run migrations:

```bash
npx prisma migrate dev
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Start Trigger.dev (Background Jobs)

In a separate terminal:

```bash
npx trigger.dev@latest dev
```

---

## 📡 API Reference

### Authentication

| Endpoint | Method | Description |
|---|---|---|
| `/api/liveblocks-auth` | POST | Authenticates the current user for a Liveblocks room. Validates project access and returns a session token with user metadata (name, avatar, color). |
| `/api/webhooks/clerk` | POST | Receives Clerk webhook events (`user.created`, `user.updated`) and syncs user data to the PostgreSQL database. |

### Projects

| Endpoint | Method | Description |
|---|---|---|
| `/api/projects` | GET | Returns all projects the authenticated user owns or has been shared with. Excludes soft-deleted projects. |
| `/api/projects` | POST | Creates a new project. Accepts `name` and optional `description` in the request body. |
| `/api/projects/[id]` | GET | Returns a single project by ID. Requires the user to be the owner or a shared collaborator. |
| `/api/projects/[id]` | PATCH | Updates a project's `name`, `description`, or `canvasData` (JSON). Owner or Editor role required. |
| `/api/projects/[id]` | DELETE | Soft-deletes a project by setting `isDeleted: true` and `deletedAt` timestamp. Owner only. |
| `/api/projects/[id]/share` | POST | Shares a project with another user by email. Accepts `email` and `role` (`VIEWER` or `EDITOR`). Owner only. |

### AI

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat` | POST | Streaming AI chat endpoint. Sends the current canvas state (nodes + edges) as context, and streams Gemini's response. Uses the Vercel AI SDK. |

### Background Jobs

| Endpoint | Method | Description |
|---|---|---|
| `/api/trigger/[...trigger]` | * | Trigger.dev webhook handler for background task execution and status updates. |

---

## 🧩 Database Schema

```prisma
model User {
  id             String          @id @default(cuid())
  clerkId        String          @unique
  email          String          @unique
  firstName      String?
  lastName       String?
  imageUrl       String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  ownedProjects  Project[]
  sharedProjects ProjectShare[]
}

model Project {
  id          String         @id @default(cuid())
  name        String
  description String?
  canvasData  Json?
  ownerId     String
  owner       User           @relation(fields: [ownerId], references: [id])
  isDeleted   Boolean        @default(false)
  deletedAt   DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  sharedWith  ProjectShare[]
}

model ProjectShare {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  role      Role     @default(VIEWER)
  createdAt DateTime @default(now())

  @@unique([projectId, userId])
}

enum Role {
  VIEWER
  EDITOR
}
```

---

## 🤖 AI Agents

### Design Agent

The Design Agent (`trigger/design-agent.ts`) is a background task that performs comprehensive system design analysis:

1. **Architecture Assessment** — Classifies the architecture pattern (microservices, monolithic, event-driven, etc.) and scores it across four dimensions:
   - Scalability (0–100)
   - Security (0–100)
   - Reliability (0–100)
   - Maintainability (0–100)

2. **Critical Issue Detection** — Identifies:
   - Single points of failure
   - Performance bottlenecks
   - Security vulnerabilities
   - Missing components (monitoring, caching, etc.)

3. **Optimization Recommendations** — Provides prioritized suggestions with:
   - Priority level (critical / high / medium / low)
   - Effort estimate
   - Description and rationale

4. **Implementation Roadmap** — Generates a phased plan for implementing the recommended improvements.

### Spec Generator

The Spec Generator (`trigger/generate-spec.ts`) produces complete technical specification documents in Markdown format, covering:

- System overview and component catalog
- Data flow and communication patterns
- API specifications (endpoints, request/response schemas)
- Scaling strategy and capacity planning
- Security architecture and threat mitigation
- Monitoring, alerting, and SLA targets
- Deployment architecture and CI/CD pipeline

Generated specs are uploaded to **Vercel Blob** and a download URL is returned.

---

## 🔄 Real-Time Collaboration

Ghost AI uses [Liveblocks](https://liveblocks.io/) for real-time collaboration features:

- **Live Cursors** — See other users' cursors on the canvas in real time
- **Presence** — Know who is online and viewing the same project
- **Synced Storage** — Canvas state (nodes + edges) is synced via `LiveList` and `LiveObject` for conflict-free collaboration
- **Room-based Access** — Each project maps to a Liveblocks room, authenticated per-user with role-based permissions

The `useCanvasAutosave` hook handles debounced persistence of canvas changes to Liveblocks storage, ensuring changes are saved without overwhelming the network.

---

## 🪝 Custom Hooks

| Hook | Purpose |
|---|---|
| `useCanvasAutosave` | Debounced auto-save of React Flow canvas state to Liveblocks storage (2-second delay) |
| `useProjectActions` | Encapsulates project CRUD API calls (create, rename, delete) with optimistic updates |
| `useProjectDialogs` | Manages open/close state for create, rename, and delete project dialogs |
| `useShareDialog` | Handles share dialog state, email input, role selection, and share submission |
| `useKeyboardShortcuts` | Registers canvas keyboard shortcuts (Delete, Ctrl+Z, Ctrl+Y, Ctrl+S) |

---

## 🧑‍💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Start Trigger.dev dev server
npx trigger.dev@latest dev

# Prisma commands
npx prisma generate       # Generate Prisma Client
npx prisma db push        # Push schema to database
npx prisma migrate dev    # Run migrations
npx prisma studio         # Open Prisma Studio GUI
```

### Key Design Decisions

- **Multi-file Prisma Schema** — Models are split across `prisma/models/*.prisma` using the `prismaSchemaFolder` preview feature for better organization
- **Soft Deletion** — Projects are soft-deleted (`isDeleted` + `deletedAt`) rather than permanently removed
- **Background AI Tasks** — Long-running AI operations (design analysis, spec generation) run as Trigger.dev background tasks to avoid API timeouts
- **Streaming Responses** — AI chat uses the Vercel AI SDK's `streamText` for real-time token streaming
- **Clerk Webhook Sync** — User data is synced from Clerk to PostgreSQL via webhooks, maintaining a local user table for relational queries

---

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository on [Vercel](https://vercel.com/new)
3. Configure all environment variables in the Vercel dashboard
4. Set up the Clerk webhook to point to your production URL (`https://your-domain.com/api/webhooks/clerk`)
5. Configure Liveblocks to allow your production domain
6. Deploy!

### Required Services

| Service | Purpose | Setup |
|---|---|---|
| [Vercel](https://vercel.com/) | Hosting & Blob Storage | Import GitHub repo |
| [PostgreSQL](https://neon.tech/) | Database | Create a database and add connection string |
| [Clerk](https://clerk.com/) | Authentication | Create app, configure webhook |
| [Liveblocks](https://liveblocks.io/) | Real-time collaboration | Create project, add secret key |
| [Google AI Studio](https://aistudio.google.com/) | Gemini AI | Generate API key |
| [Trigger.dev](https://trigger.dev/) | Background jobs | Create project, add secret key |

---

## 📄 License

This project is private and not licensed for public use.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/VrajVaghela">Vraj Vaghela</a>
</p>
