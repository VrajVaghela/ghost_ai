"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  type EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  useReactFlow,
} from "@xyflow/react"
import { cn } from "@/lib/utils"

export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const { setEdges } = useReactFlow()
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState((data?.label as string) || "")
  const [inputWidth, setInputWidth] = useState(60)
  const spanRef = useRef<HTMLSpanElement>(null)

  // Sync state if edge data updates from other collaborators
  useEffect(() => {
    setValue((data?.label as string) || "")
  }, [data?.label])

  // Adjust input width to match text length
  useEffect(() => {
    if (spanRef.current) {
      // Add a bit of padding so it feels comfortable to type
      setInputWidth(Math.max(60, spanRef.current.offsetWidth + 20))
    }
  }, [value, isEditing])

  const saveLabel = (newLabel: string) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            data: {
              ...e.data,
              label: newLabel,
            },
          }
        }
        return e
      })
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setIsEditing(false)
      saveLabel(value)
    } else if (e.key === "Escape") {
      e.preventDefault()
      setValue((data?.label as string) || "")
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    saveLabel(value)
  }

  const hasLabel = !!data?.label && (data.label as string).trim() !== ""
  const showLabel = hasLabel || isHovered || selected || isEditing

  // Set line styling based on state
  // Rest: dimmed gray/zinc color
  // Hovered/Selected: bright blue or bright gray/zinc
  const edgeColor = selected ? "#3b82f6" : isHovered ? "#c0c0cc" : "#505060"
  const edgeWidth = selected ? 2.5 : 1.5

  return (
    <>
      <g
        className="react-flow__edge-path-group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={(e) => {
          e.stopPropagation()
          setIsEditing(true)
        }}
      >
        {/* Invisible thick path for easier hovering and clicking */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          className="react-flow__edge-interaction pointer-events-auto"
        />
        {/* Visible line */}
        <path
          d={edgePath}
          fill="none"
          stroke={edgeColor}
          strokeWidth={edgeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd={
            selected
              ? "url(#arrow-selected)"
              : isHovered
              ? "url(#arrow-hover)"
              : "url(#arrow-rest)"
          }
          style={style}
          className="transition-colors duration-150 pointer-events-none"
        />
      </g>

      <EdgeLabelRenderer>
        {showLabel && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan nowheel z-50"
          >
            {isEditing ? (
              <div className="relative">
                {/* Mirror span for measuring text width */}
                <span
                  ref={spanRef}
                  className="absolute invisible whitespace-pre font-medium text-xs px-2 py-0.5"
                >
                  {value || "Add label"}
                </span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  style={{ width: `${inputWidth}px` }}
                  className="bg-bg-elevated/95 text-center font-medium text-text-primary text-xs border border-blue-500 rounded-full px-2 py-0.5 shadow-md focus:ring-0 focus:outline-none"
                  autoFocus
                />
              </div>
            ) : (
              <div
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium shadow-sm transition-all duration-150 cursor-text select-none border",
                  hasLabel
                    ? "bg-bg-elevated/90 backdrop-blur border-border-default text-text-secondary hover:text-text-primary hover:border-text-muted/50"
                    : "bg-bg-elevated/70 backdrop-blur border-dashed border-border-subtle/50 text-text-muted/60 hover:text-text-secondary hover:border-border-subtle"
                )}
              >
                {hasLabel ? (data.label as string) : "+ Add label"}
              </div>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
