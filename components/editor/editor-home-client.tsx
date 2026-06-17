"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectSummary } from "@/lib/data/projects"

interface EditorHomeClientProps {
  ownedProjects: ProjectSummary[]
  sharedProjects: ProjectSummary[]
}

export function EditorHomeClient({ ownedProjects, sharedProjects }: EditorHomeClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const actions = useProjectActions()

  return (
    <div className="min-h-screen bg-bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={actions.openCreate}
        onRenameProject={actions.openRename}
        onDeleteProject={actions.openDelete}
      />

      <main className="flex min-h-screen flex-col items-center justify-center gap-4 pt-12">
        <h1 className="text-xl font-semibold text-text-primary">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-text-muted">
          Start a new architecture workspace, or choose a project from the sidebar.
        </p>
        <Button variant="default" className="gap-2" onClick={actions.openCreate}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </main>

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
