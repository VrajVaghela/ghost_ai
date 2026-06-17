"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import type { ProjectSummary } from "@/lib/data/projects"

type DialogMode = "none" | "create" | "rename" | "delete"

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function shortSuffix() {
  return Math.random().toString(36).slice(2, 6)
}

export function useProjectActions() {
  const router = useRouter()
  const pathname = usePathname()

  const [mode, setMode] = useState<DialogMode>("none")
  const [targetProject, setTargetProject] = useState<ProjectSummary | null>(null)
  const [name, setName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [loading, setLoading] = useState(false)

  const roomId = `${slugify(name || "untitled")}-${suffix}`

  function openCreate() {
    setName("")
    setSuffix(shortSuffix())
    setMode("create")
  }

  function openRename(project: ProjectSummary) {
    setTargetProject(project)
    setName(project.name)
    setMode("rename")
  }

  function openDelete(project: ProjectSummary) {
    setTargetProject(project)
    setMode("delete")
  }

  function closeDialog() {
    setMode("none")
    setTargetProject(null)
    setName("")
  }

  async function submitCreate() {
    setLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Untitled Project", id: roomId }),
      })
      if (!res.ok) throw new Error("Failed to create project")
      const project: ProjectSummary = await res.json()
      setMode("none")
      router.push(`/editor/${project.id}`)
    } finally {
      setLoading(false)
    }
  }

  async function submitRename() {
    if (!targetProject) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${targetProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) throw new Error("Failed to rename project")
      setMode("none")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function submitDelete() {
    if (!targetProject) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${targetProject.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete project")
      setMode("none")
      if (pathname?.includes(targetProject.id)) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    mode,
    name,
    setName,
    roomId,
    loading,
    targetProject,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  }
}
