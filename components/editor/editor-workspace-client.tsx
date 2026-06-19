"use client"

import { useState, useEffect } from "react"
import { PanelLeftClose, PanelLeftOpen, Sparkles, Share2, LayoutGrid, Save, Loader2, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { AISidebar } from "@/components/editor/ai-sidebar"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { ShareDialog } from "@/components/editor/share-dialog"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { useShareDialog } from "@/hooks/use-share-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react"
import { CanvasWrapper } from "@/components/editor/canvas/canvas-wrapper"
import type { ProjectSummary } from "@/lib/data/projects"

interface Project {
  id: string
  name: string
}

interface EditorWorkspaceClientProps {
  project: Project
  isOwner: boolean
  ownedProjects: ProjectSummary[]
  sharedProjects: ProjectSummary[]
}

export function EditorWorkspaceClient({
  project,
  isOwner,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false)
  const share = useShareDialog(project.id)
  const actions = useProjectActions()

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  useEffect(() => {
    const handleStatusChange = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && typeof detail === "object" && "status" in detail) {
        setSaveStatus(detail.status)
      }
    }

    window.addEventListener("canvas-save-status", handleStatusChange)
    return () => window.removeEventListener("canvas-save-status", handleStatusChange)
  }, [])

  const handleSave = () => {
    window.dispatchEvent(new CustomEvent("canvas-manual-save"))
  }

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={project.id}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <div className="flex h-screen flex-col overflow-hidden bg-bg-base">
      <header className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center border-b border-border-default bg-bg-surface px-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
          <span className="max-w-[200px] truncate text-sm font-semibold text-text-primary">
            {project.name}
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 min-w-[80px] transition-all duration-300",
              saveStatus === "saved" && "border-state-success/30 bg-state-success/10 text-state-success hover:bg-state-success/20",
              saveStatus === "error" && "border-destructive/30 bg-destructive/10 text-destructive-foreground hover:bg-destructive/20"
            )}
            onClick={handleSave}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving" && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
            {saveStatus === "saved" && <Check className="h-4 w-4 text-state-success" />}
            {saveStatus === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
            {saveStatus === "idle" && <Save className="h-4 w-4 text-text-muted" />}
            <span>
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "error" && "Error"}
              {saveStatus === "idle" && "Save"}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.dispatchEvent(new CustomEvent("open-starter-templates"))}
          >
            <LayoutGrid className="h-4 w-4" />
            Templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={share.openDialog}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-pressed={isAISidebarOpen}
            className={cn(
              "gap-2 border-[#62C073]/30 bg-[#62C073]/10 text-[#62C073] transition-colors",
              "hover:bg-[#62C073]/20 hover:text-[#62C073]",
              isAISidebarOpen && "bg-[#62C073]/20"
            )}
            onClick={() => setIsAISidebarOpen((prev) => !prev)}
          >
            <Sparkles className="h-4 w-4" />
            Ask AI
          </Button>
        </div>
      </header>

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeProjectId={project.id}
        onCreateProject={actions.openCreate}
        onRenameProject={actions.openRename}
        onDeleteProject={actions.openDelete}
      />

      <main className="flex flex-1 bg-bg-base pt-12">
        <CanvasWrapper />
      </main>

      <AISidebar
        isOpen={isAISidebarOpen}
        onClose={() => setIsAISidebarOpen(false)}
        projectId={project.id}
      />

      <ShareDialog
        open={share.open}
        onClose={share.closeDialog}
        isOwner={isOwner}
        collaborators={share.collaborators}
        loadingList={share.loadingList}
        email={share.email}
        onEmailChange={share.setEmail}
        onInvite={share.invite}
        inviting={share.inviting}
        error={share.error}
        onRemove={share.remove}
        removingId={share.removingId}
      />

      <CreateProjectDialog
        open={actions.mode === "create"}
        name={actions.name}
        slug={actions.roomId}
        loading={actions.loading}
        onNameChange={actions.setName}
        onClose={actions.closeDialog}
        onSubmit={actions.submitCreate}
      />

      <RenameProjectDialog
        open={actions.mode === "rename"}
        currentName={actions.targetProject?.name ?? ""}
        name={actions.name}
        slug={actions.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")}
        loading={actions.loading}
        onNameChange={actions.setName}
        onClose={actions.closeDialog}
        onSubmit={actions.submitRename}
      />

      <DeleteProjectDialog
        open={actions.mode === "delete"}
        projectName={actions.targetProject?.name ?? ""}
        loading={actions.loading}
        onClose={actions.closeDialog}
        onSubmit={actions.submitDelete}
      />
    </div>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
