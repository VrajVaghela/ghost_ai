"use client"

import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Share2, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { useShareDialog } from "@/hooks/use-share-dialog"
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
        onCreateProject={() => {}}
        onRenameProject={() => {}}
        onDeleteProject={() => {}}
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

      {isAISidebarOpen && (
        <aside className="fixed right-0 top-12 z-40 flex h-[calc(100vh-3rem)] w-80 items-center justify-center border-l border-border-default bg-bg-elevated">
          <p className="select-none text-sm text-text-muted">AI chat coming soon</p>
        </aside>
      )}

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
    </div>
  )
}
