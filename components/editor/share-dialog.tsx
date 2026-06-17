"use client"

import { useState } from "react"
import { Check, Copy, Link2, Loader2, Trash2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Collaborator } from "@/lib/data/collaborators"

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  isOwner: boolean
  collaborators: Collaborator[]
  loadingList: boolean
  email: string
  onEmailChange: (value: string) => void
  onInvite: () => void
  inviting: boolean
  error: string | null
  onRemove: (id: string) => void
  removingId: string | null
}

function initials(collaborator: Collaborator) {
  const source = collaborator.name || collaborator.email
  return source.trim().charAt(0).toUpperCase() || "?"
}

export function ShareDialog({
  open,
  onClose,
  isOwner,
  collaborators,
  loadingList,
  email,
  onEmailChange,
  onInvite,
  inviting,
  error,
  onRemove,
  removingId,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — nothing to surface.
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !inviting && email.trim()) {
      onInvite()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Invite collaborators by email to give them access."
              : "People with access to this project."}
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="collaborator@example.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <Button
                variant="default"
                disabled={inviting || !email.trim()}
                onClick={onInvite}
              >
                {inviting ? "Inviting…" : "Invite"}
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Collaborators
          </p>
          <ScrollArea className="max-h-64">
            {loadingList ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading collaborators…
              </div>
            ) : collaborators.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">
                No collaborators yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-1 pr-2">
                {collaborators.map((collaborator) => (
                  <li
                    key={collaborator.id}
                    className="flex items-center gap-3 rounded-lg px-1.5 py-1.5"
                  >
                    {collaborator.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={collaborator.imageUrl}
                        alt=""
                        className="size-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                        {initials(collaborator)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        {collaborator.name ?? collaborator.email}
                      </p>
                      {collaborator.name && (
                        <p className="truncate text-xs text-muted-foreground">
                          {collaborator.email}
                        </p>
                      )}
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${collaborator.email}`}
                        disabled={removingId === collaborator.id}
                        onClick={() => onRemove(collaborator.id)}
                      >
                        {removingId === collaborator.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>

        {isOwner && (
          <div className="-mx-4 -mb-4 flex items-center justify-between gap-2 rounded-b-xl border-t bg-muted/50 p-4">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link2 className="size-4" />
              Anyone you invite can open this link.
            </span>
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy link
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
