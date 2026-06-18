"use client"

import React from "react"
import { useOthers } from "@liveblocks/react"
import { UserButton, useUser } from "@clerk/nextjs"

export function PresenceAvatars() {
  const others = useOthers()
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return null
  }

  const collaborators = others.filter((other) => other.id !== user?.id)
  const visibleCollaborators = collaborators.slice(0, 5)
  const overflowCount = Math.max(0, collaborators.length - 5)

  function getInitials(name: string): string {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
      {collaborators.length > 0 ? (
        <div className="flex items-center gap-2 rounded-full bg-[#111114]/85 backdrop-blur-md border border-border-default p-1.5 pr-2.5 shadow-lg">
          <div className="flex -space-x-1.5">
            {visibleCollaborators.map((other) => {
              const name = other.info?.name || "Collaborator"
              const avatar = other.info?.avatar
              const color = other.info?.color || "#3b82f6"

              return (
                <div
                  key={other.connectionId}
                  className="relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ring-2 ring-[#0d0d0d] bg-bg-surface text-xs font-semibold text-text-primary"
                  title={name}
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center rounded-full text-[10px] bg-bg-elevated border border-border-default font-bold"
                      style={{
                        borderColor: color,
                        color: color,
                      }}
                    >
                      {getInitials(name)}
                    </div>
                  )}
                </div>
              )
            })}
            {overflowCount > 0 && (
              <div className="relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ring-2 ring-[#0d0d0d] bg-bg-elevated border border-border-default text-xs font-semibold text-text-muted">
                +{overflowCount}
              </div>
            )}
          </div>
          <div className="h-4 w-[1px] bg-border-default mx-1 self-center" />
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      ) : (
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "h-8 w-8",
            },
          }}
        />
      )}
    </div>
  )
}
