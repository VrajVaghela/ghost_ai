"use client"

import { useEffect, useRef } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RenameProjectDialogProps {
  open: boolean
  currentName: string
  name: string
  slug: string
  loading: boolean
  onNameChange: (name: string) => void
  onClose: () => void
  onSubmit: () => void
}

export function RenameProjectDialog({
  open,
  currentName,
  name,
  slug,
  loading,
  onNameChange,
  onClose,
  onSubmit,
}: RenameProjectDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && slug) {
      onSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription>
            Renaming &ldquo;{currentName}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="rename-project-name">
              New name
            </label>
            <Input
              id="rename-project-name"
              ref={inputRef}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
          </div>
          {name && (
            <p className={`text-xs ${slug ? "text-muted-foreground" : "text-destructive"}`}>
              {slug
                ? <>Slug: <span className="font-mono">{slug}</span></>
                : "Name must contain at least one letter or number."}
            </p>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button
            variant="default"
            disabled={!slug || loading}
            onClick={onSubmit}
          >
            {loading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
