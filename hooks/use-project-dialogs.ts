"use client"

import { useState } from "react"

import { type Project } from "@/lib/mock-projects"

type DialogType = "create" | "rename" | "delete" | null

interface DialogState {
  type: DialogType
  project: Project | null
}

interface FormState {
  name: string
  slug: string
}

export function useProjectDialogs() {
  const [dialog, setDialog] = useState<DialogState>({ type: null, project: null })
  const [form, setForm] = useState<FormState>({ name: "", slug: "" })
  const [loading, setLoading] = useState(false)

  function slugify(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  function openCreate() {
    setForm({ name: "", slug: "" })
    setDialog({ type: "create", project: null })
  }

  function openRename(project: Project) {
    setForm({ name: project.name, slug: project.slug })
    setDialog({ type: "rename", project })
  }

  function openDelete(project: Project) {
    setForm({ name: "", slug: "" })
    setDialog({ type: "delete", project })
  }

  function closeDialog() {
    setDialog({ type: null, project: null })
    setForm({ name: "", slug: "" })
  }

  function handleNameChange(name: string) {
    setForm({ name, slug: slugify(name) })
  }

  async function submitCreate() {
    setLoading(true)
    // No persistence yet — mock delay
    await new Promise((r) => setTimeout(r, 300))
    setLoading(false)
    closeDialog()
  }

  async function submitRename() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    setLoading(false)
    closeDialog()
  }

  async function submitDelete() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    setLoading(false)
    closeDialog()
  }

  return {
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
  }
}
