"use client"

import Link from "next/link"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { ProjectSummary } from "@/lib/data/projects"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: ProjectSummary[]
  sharedProjects: ProjectSummary[]
  activeProjectId?: string
  onCreateProject: () => void
  onRenameProject: (project: ProjectSummary) => void
  onDeleteProject: (project: ProjectSummary) => void
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  activeProjectId,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-12 z-40 flex h-[calc(100vh-3rem)] w-72 flex-col",
          "border-r border-border-default bg-bg-elevated",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <span className="text-sm font-semibold text-text-primary">Projects</span>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden p-3">
          <Tabs defaultValue="my-projects" className="flex flex-1 flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="flex flex-1 flex-col overflow-hidden">
              {ownedProjects.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-text-muted">No projects yet</p>
                </div>
              ) : (
                <ul className="mt-2 flex flex-col gap-0.5 overflow-y-auto">
                  {ownedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      isActive={project.id === activeProjectId}
                      onRename={() => onRenameProject(project)}
                      onDelete={() => onDeleteProject(project)}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="shared" className="flex flex-1 flex-col overflow-hidden">
              {sharedProjects.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-text-muted">No shared projects</p>
                </div>
              ) : (
                <ul className="mt-2 flex flex-col gap-0.5 overflow-y-auto">
                  {sharedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      isActive={project.id === activeProjectId}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-border-default p-3">
          <Button variant="default" className="w-full gap-2" onClick={onCreateProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}

interface ProjectItemProps {
  project: ProjectSummary
  isActive?: boolean
  onRename?: () => void
  onDelete?: () => void
}

function ProjectItem({ project, isActive, onRename, onDelete }: ProjectItemProps) {
  const hasActions = !!onRename && !!onDelete

  return (
    <li className={cn(
      "group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-bg-subtle",
      isActive && "bg-bg-subtle"
    )}>
      <Link
        href={`/editor/${project.id}`}
        className="min-w-0 flex-1 truncate text-sm text-text-primary"
      >
        {project.name}
      </Link>
      {hasActions && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRename}
            title="Rename"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      )}
    </li>
  )
}
