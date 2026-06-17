"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { Button } from "@/components/ui/button"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const {
    dialog,
    form,
    loading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleNameChange,
    submitCreate,
    submitRename,
    submitDelete,
  } = useProjectDialogs()

  return (
    <div className="min-h-screen bg-bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCreateProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
      />

      <main className="flex min-h-screen flex-col items-center justify-center gap-4 pt-12">
        <h1 className="text-xl font-semibold text-text-primary">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-text-muted">
          Start a new architecture workspace, or choose a project from the sidebar.
        </p>
        <Button variant="default" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </main>

      <CreateProjectDialog
        open={dialog.type === "create"}
        name={form.name}
        slug={form.slug}
        loading={loading}
        onNameChange={handleNameChange}
        onClose={closeDialog}
        onSubmit={submitCreate}
      />

      <RenameProjectDialog
        open={dialog.type === "rename"}
        currentName={dialog.project?.name ?? ""}
        name={form.name}
        slug={form.slug}
        loading={loading}
        onNameChange={handleNameChange}
        onClose={closeDialog}
        onSubmit={submitRename}
      />

      <DeleteProjectDialog
        open={dialog.type === "delete"}
        projectName={dialog.project?.name ?? ""}
        loading={loading}
        onClose={closeDialog}
        onSubmit={submitDelete}
      />
    </div>
  )
}
