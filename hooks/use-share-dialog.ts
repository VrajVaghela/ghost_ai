"use client"

import { useCallback, useState } from "react"

import type { Collaborator } from "@/lib/data/collaborators"

export function useShareDialog(projectId: string) {
  const [open, setOpen] = useState(false)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const loadCollaborators = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`)
      if (res.ok) setCollaborators(await res.json())
    } finally {
      setLoadingList(false)
    }
  }, [projectId])

  function openDialog() {
    setError(null)
    setEmail("")
    setOpen(true)
    loadCollaborators()
  }

  function closeDialog() {
    setOpen(false)
  }

  async function invite() {
    const value = email.trim()
    if (!value) return

    setInviting(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Failed to invite collaborator")
        return
      }
      const collaborator: Collaborator = await res.json()
      setCollaborators((prev) => [
        collaborator,
        ...prev.filter((c) => c.email !== collaborator.email),
      ])
      setEmail("")
    } finally {
      setInviting(false)
    }
  }

  async function remove(id: string) {
    setRemovingId(id)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators/${id}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        setCollaborators((prev) => prev.filter((c) => c.id !== id))
      }
    } finally {
      setRemovingId(null)
    }
  }

  return {
    open,
    openDialog,
    closeDialog,
    collaborators,
    loadingList,
    email,
    setEmail,
    invite,
    inviting,
    error,
    remove,
    removingId,
  }
}
