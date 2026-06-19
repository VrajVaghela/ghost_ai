"use client"

import { useState, useEffect, useRef } from "react"
import { Handle, Position, type NodeProps, useReactFlow, NodeResizer } from "@xyflow/react"
import { cn } from "@/lib/utils"
import type { NodeData, NodeColorPair } from "@/types/canvas"
import { SHAPE_PALETTES, NODE_COLORS } from "@/types/canvas"

type CanvasNodeProps = NodeProps & {
  data: NodeData
}

function ColorSwatch({
  pair,
  isActive,
  onClick,
}: {
  pair: NodeColorPair
  isActive: boolean
  onClick: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      type="button"
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 cursor-pointer relative outline-none border border-transparent",
        isActive
          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-bg-elevated scale-110"
          : ""
      )}
      style={{
        backgroundColor: pair.bg,
        boxShadow: isHovered
          ? `0 0 6px 1.5px ${pair.text}90` // tight, controlled glow based on text color
          : undefined,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`Change color to ${pair.bg}`}
    >
      {/* Visual indicator of the text color */}
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: pair.text,
        }}
      />
    </button>
  )
}

export function CanvasNode({ id, data, selected }: CanvasNodeProps) {
  const shape = data.shape || "rectangle"
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { updateNodeData } = useReactFlow()
  
  // Resolve shape-specific premium colors
  const palette = SHAPE_PALETTES[shape] || { bg: "rgba(24, 24, 28, 0.85)", border: "#3a3a42" }
  const bgColor = data.color || palette.bg

  // Resolve matching text color
  const resolvedTextColor = data.textColor || 
    NODE_COLORS.find(c => c.bg.toLowerCase() === (data.color || "").toLowerCase())?.text ||
    NODE_COLORS.find(c => c.bg.toLowerCase() === bgColor.toLowerCase())?.text

  // Calculate borders to reflect the text color if we have a custom color, otherwise the shape palette
  const baseBorderColor = resolvedTextColor || palette.border
  const borderCol = selected ? "#3b82f6" : `${baseBorderColor}66`

  const handleVisibleClass = "w-2 h-2 !bg-white !border !border-neutral-800 transition-opacity duration-200 group-hover:opacity-100 opacity-0 hover:!scale-125 !min-w-0 !min-h-0"
  const handleInvisibleClass = "w-2 h-2 opacity-0 !pointer-events-auto !min-w-0 !min-h-0"

  const isLabelEmpty = !data.label || data.label.trim() === ""
  const displayLabel = isLabelEmpty ? "Double-click to edit" : data.label

  const labelColorStyle = resolvedTextColor 
    ? { color: isLabelEmpty ? `${resolvedTextColor}99` : resolvedTextColor }
    : undefined

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setIsEditing(false)
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      setIsEditing(false)
    }
  }

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      const length = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }, [isEditing])

  const renderTextarea = () => {
    let insetClass = "inset-x-3"
    if (shape === "diamond") {
      insetClass = "inset-x-5"
    } else if (shape === "circle") {
      insetClass = "inset-x-4"
    }

    return (
      <textarea
        ref={textareaRef}
        value={data.label}
        onChange={(e) => updateNodeData(id, { label: e.target.value })}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(e) => {
          e.stopPropagation()
          handleKeyDown(e)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={resolvedTextColor ? { color: resolvedTextColor } : undefined}
        className={cn(
          "nodrag nopan nowheel absolute top-1/2 -translate-y-1/2 h-10 bg-bg-elevated/95 text-center font-semibold text-text-primary text-xs sm:text-sm resize-none outline-none border border-blue-500/50 rounded px-1.5 py-1 focus:ring-0 focus:outline-none z-10",
          insetClass
        )}
        placeholder="Label"
      />
    )
  }

  const renderShapeContent = () => {
    switch (shape) {
      case "rectangle":
        return (
          <div
            onDoubleClick={handleDoubleClick}
            className="flex h-full w-full items-center justify-center rounded-lg border text-center transition-all duration-200 relative"
            style={{
              backgroundColor: bgColor,
              borderColor: borderCol,
              borderWidth: selected ? "2px" : "1.5px",
              boxShadow: selected ? "0 0 12px rgba(59, 130, 246, 0.35)" : "none",
            }}
          >
            {isEditing ? (
              renderTextarea()
            ) : (
              <span
                className={cn(
                  "truncate select-none font-semibold px-3 text-center w-full text-xs sm:text-sm cursor-text",
                  !resolvedTextColor && (isLabelEmpty ? "text-text-muted/60" : "text-text-primary")
                )}
                style={labelColorStyle}
              >
                {displayLabel}
              </span>
            )}
          </div>
        )
      case "circle":
        return (
          <div
            onDoubleClick={handleDoubleClick}
            className="flex h-full w-full items-center justify-center rounded-full border text-center transition-all duration-200 aspect-square relative"
            style={{
              backgroundColor: bgColor,
              borderColor: borderCol,
              borderWidth: selected ? "2px" : "1.5px",
              boxShadow: selected ? "0 0 12px rgba(59, 130, 246, 0.35)" : "none",
            }}
          >
            {isEditing ? (
              renderTextarea()
            ) : (
              <span
                className={cn(
                  "truncate select-none font-semibold px-2 text-center w-full text-xs sm:text-sm cursor-text",
                  !resolvedTextColor && (isLabelEmpty ? "text-text-muted/60" : "text-text-primary")
                )}
                style={labelColorStyle}
              >
                {displayLabel}
              </span>
            )}
          </div>
        )
      case "pill":
        return (
          <div
            onDoubleClick={handleDoubleClick}
            className="flex h-full w-full items-center justify-center rounded-full border text-center transition-all duration-200 relative"
            style={{
              backgroundColor: bgColor,
              borderColor: borderCol,
              borderWidth: selected ? "2px" : "1.5px",
              boxShadow: selected ? "0 0 12px rgba(59, 130, 246, 0.35)" : "none",
            }}
          >
            {isEditing ? (
              renderTextarea()
            ) : (
              <span
                className={cn(
                  "truncate select-none font-semibold px-4 text-center w-full text-xs sm:text-sm cursor-text",
                  !resolvedTextColor && (isLabelEmpty ? "text-text-muted/60" : "text-text-primary")
                )}
                style={labelColorStyle}
              >
                {displayLabel}
              </span>
            )}
          </div>
        )
      case "diamond":
        return (
          <div 
            onDoubleClick={handleDoubleClick}
            className="relative h-full w-full"
          >
            <svg
              className="absolute inset-0 h-full w-full filter drop-shadow-md"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon
                points="50,2 98,50 50,98 2,50"
                fill={bgColor}
                stroke={borderCol}
                strokeWidth={selected ? 2.5 : 1.5}
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-200"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {isEditing ? (
                renderTextarea()
              ) : (
                <span
                  className={cn(
                    "truncate select-none font-semibold text-center w-full text-xs sm:text-sm cursor-text",
                    !resolvedTextColor && (isLabelEmpty ? "text-text-muted/60" : "text-text-primary")
                  )}
                  style={labelColorStyle}
                >
                  {displayLabel}
                </span>
              )}
            </div>
          </div>
        )
      case "hexagon":
        return (
          <div 
            onDoubleClick={handleDoubleClick}
            className="relative h-full w-full"
          >
            <svg
              className="absolute inset-0 h-full w-full filter drop-shadow-md"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon
                points="25,2 75,2 98,50 75,98 25,98 2,50"
                fill={bgColor}
                stroke={borderCol}
                strokeWidth={selected ? 2.5 : 1.5}
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-200"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center p-3">
              {isEditing ? (
                renderTextarea()
              ) : (
                <span
                  className={cn(
                    "truncate select-none font-semibold text-center w-full text-xs sm:text-sm cursor-text",
                    !resolvedTextColor && (isLabelEmpty ? "text-text-muted/60" : "text-text-primary")
                  )}
                  style={labelColorStyle}
                >
                  {displayLabel}
                </span>
              )}
            </div>
          </div>
        )
      case "cylinder":
        return (
          <div 
            onDoubleClick={handleDoubleClick}
            className="relative h-full w-full"
          >
            <svg
              className="absolute inset-0 h-full w-full filter drop-shadow-md"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 2,12 L 2,88 A 48,10 0 0,0 98,88 L 98,12 Z"
                fill={bgColor}
                stroke={borderCol}
                strokeWidth={selected ? 2.5 : 1.5}
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-200"
              />
              <ellipse
                cx="50"
                cy="12"
                rx="48"
                ry="10"
                fill={bgColor}
                stroke={borderCol}
                strokeWidth={selected ? 2.5 : 1.5}
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-200"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pt-6 pb-2 px-3">
              {isEditing ? (
                renderTextarea()
              ) : (
                <span
                  className={cn(
                    "truncate select-none font-semibold text-center w-full text-xs sm:text-sm cursor-text",
                    !resolvedTextColor && (isLabelEmpty ? "text-text-muted/60" : "text-text-primary")
                  )}
                  style={labelColorStyle}
                >
                  {displayLabel}
                </span>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full w-full relative group">
      <NodeResizer
        isVisible={!!selected}
        minWidth={shape === "circle" ? 50 : 50}
        minHeight={shape === "circle" ? 50 : 40}
        keepAspectRatio={shape === "circle"}
        lineClassName="!border-blue-500/50"
        handleClassName="!w-2 !h-2 !bg-bg-surface !border !border-blue-500 !rounded-sm hover:!scale-125 transition-transform"
      />

      {/* Floating color toolbar for selected nodes */}
      {selected && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50 flex items-center gap-1.5 bg-bg-surface/90 backdrop-blur-md border border-border-default rounded-xl px-2 py-1.5 shadow-lg nodrag nopan nowheel"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {NODE_COLORS.map((pair, idx) => {
            const isActive = bgColor.toLowerCase() === pair.bg.toLowerCase()
            return (
              <ColorSwatch
                key={idx}
                pair={pair}
                isActive={isActive}
                onClick={() => {
                  updateNodeData(id, { color: pair.bg, textColor: pair.text })
                }}
              />
            )
          })}
        </div>
      )}

      {renderShapeContent()}

      {/* Connection Handles: Support both Source and Target at all 4 locations */}
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className={handleInvisibleClass}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className={handleVisibleClass}
      />

      {/* Bottom Handle */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className={handleInvisibleClass}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className={handleVisibleClass}
      />

      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className={handleInvisibleClass}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className={handleVisibleClass}
      />

      {/* Right Handle */}
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className={handleInvisibleClass}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className={handleVisibleClass}
      />
    </div>
  )
}
