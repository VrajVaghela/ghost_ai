"use client"

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

interface CreateProjectDialogProps {
  open: boolean
  name: string
  slug: string
  loading: boolean
  onNameChange: (name: string) => void
  onClose: () => void
  onSubmit: () => void
}

export function CreateProjectDialog({
  open,
  name,
  slug,
  loading,
  onNameChange,
  onClose,
  onSubmit,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Give your new architecture workspace a name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="project-name">
              Project name
            </label>
            <Input
              id="project-name"
              placeholder="My Project"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              autoFocus
            />
          </div>
          {name && (
            <p className="text-xs text-muted-foreground">
              Slug: <span className="font-mono">{slug || "—"}</span>
            </p>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button
            variant="default"
            disabled={!name.trim() || loading}
            onClick={onSubmit}
          >
            {loading ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
