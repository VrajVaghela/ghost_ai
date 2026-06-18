"use client"

import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Share2, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { AISidebar } from "@/components/editor/ai-sidebar"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { ShareDialog } from "@/components/editor/share-dialog"
import { useShareDialog } from "@/hooks/use-share-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
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

  return (
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
            variant="ghost"
            size="icon"
            onClick={() => setIsAISidebarOpen((prev) => !prev)}
          >
            {isAISidebarOpen ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRightOpen className="h-5 w-5" />
            )}
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

      <main
        className={cn(
          "flex flex-1 bg-[#0d0d0d] pt-12",
          "transition-all duration-300",
          isSidebarOpen && "ml-72",
          isAISidebarOpen && "mr-80"
        )}
      >
        <CanvasWrapper roomId={project.id} />
      </main>

      <AISidebar
        isOpen={isAISidebarOpen}
        onClose={() => setIsAISidebarOpen(false)}
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
  )
}
