"use client"

import React from "react"
import { useOthers } from "@liveblocks/react"
import { useReactFlow, useViewport } from "@xyflow/react"
import { useUser } from "@clerk/nextjs"

export function CollaboratorCursors() {
  const others = useOthers()
  const { user } = useUser()
  const reactFlow = useReactFlow()
  
  // Subscribing to viewport updates (pan/zoom) so this component re-renders
  // and updates cursor screen positions immediately.
  useViewport()

  const activeCollaborators = others.filter(
    (other) => other.id !== user?.id && other.presence?.cursor !== null
  )

  if (activeCollaborators.length === 0) {
    return null
  }

  // Get the bounding rect of the React Flow container to compute positions relative to it.
  const container = typeof document !== "undefined" ? document.querySelector(".react-flow") : null
  if (!container) return null

  const rect = container.getBoundingClientRect()

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {activeCollaborators.map((other) => {
        const cursor = other.presence?.cursor
        if (!cursor) return null

        // Convert the flow coordinates to screen (viewport) coordinates
        const screenPos = reactFlow.flowToScreenPosition(cursor)
        
        // Compute position relative to the React Flow container
        const x = screenPos.x - rect.left
        const y = screenPos.y - rect.top

        // If cursor is completely outside the visible canvas boundary, do not render it
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
          return null
        }

        const name = other.info?.name || "Collaborator"
        const color = other.info?.color || "#3b82f6"

        return (
          <div
            key={other.connectionId}
            className="absolute left-0 top-0 pointer-events-none transition-transform duration-[40ms] ease-out"
            style={{
              transform: `translate3d(${x}px, ${y}px, 0)`,
            }}
          >
            <svg
              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
              style={{
                transform: "translate(-1px, -1px)",
              }}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1V14.5L5.5 10H10.5L1 1Z"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="absolute left-4 top-4 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white shadow-md select-none whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              {name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
