"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import type { NodeData } from "@/types/canvas"
import { SHAPE_PALETTES } from "@/types/canvas"

type CanvasNodeProps = NodeProps & {
  data: NodeData
}

export function CanvasNode({ data, selected }: CanvasNodeProps) {
  const shape = data.shape || "rectangle"
  
  // Resolve shape-specific premium colors
  const palette = SHAPE_PALETTES[shape] || { bg: "rgba(24, 24, 28, 0.85)", border: "#3a3a42" }
  const bgColor = data.color || palette.bg
  const borderCol = selected ? "#3b82f6" : palette.border

  const handleVisibleClass = "w-2.5 h-2.5 !bg-blue-500 !border-bg-base hover:scale-125 transition-all duration-150"
  const handleInvisibleClass = "w-2.5 h-2.5 opacity-0 !pointer-events-auto"

  const renderShapeContent = () => {
    switch (shape) {
      case "rectangle":
        return (
          <div
            className="flex h-full w-full items-center justify-center rounded-lg border-2 text-center transition-all duration-200"
            style={{
              backgroundColor: bgColor,
              borderColor: borderCol,
              boxShadow: selected ? "0 0 12px rgba(59, 130, 246, 0.35)" : "none",
            }}
          >
            <span className="truncate select-none font-semibold text-text-primary px-3 text-center w-full text-xs sm:text-sm">
              {data.label}
            </span>
          </div>
        )
      case "circle":
        return (
          <div
            className="flex h-full w-full items-center justify-center rounded-full border-2 text-center transition-all duration-200 aspect-square"
            style={{
              backgroundColor: bgColor,
              borderColor: borderCol,
              boxShadow: selected ? "0 0 12px rgba(59, 130, 246, 0.35)" : "none",
            }}
          >
            <span className="truncate select-none font-semibold text-text-primary px-2 text-center w-full text-xs sm:text-sm">
              {data.label}
            </span>
          </div>
        )
      case "pill":
        return (
          <div
            className="flex h-full w-full items-center justify-center rounded-full border-2 text-center transition-all duration-200"
            style={{
              backgroundColor: bgColor,
              borderColor: borderCol,
              boxShadow: selected ? "0 0 12px rgba(59, 130, 246, 0.35)" : "none",
            }}
          >
            <span className="truncate select-none font-semibold text-text-primary px-4 text-center w-full text-xs sm:text-sm">
              {data.label}
            </span>
          </div>
        )
      case "diamond":
        return (
          <div className="relative h-full w-full">
            <svg
              className="absolute inset-0 h-full w-full filter drop-shadow-md"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon
                points="50,2 98,50 50,98 2,50"
                fill={bgColor}
                stroke={borderCol}
                strokeWidth={2}
                className="transition-all duration-200"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <span className="truncate select-none font-semibold text-text-primary text-center w-full text-xs sm:text-sm">
                {data.label}
              </span>
            </div>
          </div>
        )
      case "hexagon":
        return (
          <div className="relative h-full w-full">
            <svg
              className="absolute inset-0 h-full w-full filter drop-shadow-md"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon
                points="25,2 75,2 98,50 75,98 25,98 2,50"
                fill={bgColor}
                stroke={borderCol}
                strokeWidth={2}
                className="transition-all duration-200"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <span className="truncate select-none font-semibold text-text-primary text-center w-full text-xs sm:text-sm">
                {data.label}
              </span>
            </div>
          </div>
        )
      case "cylinder":
        return (
          <div className="relative h-full w-full">
            <svg
              className="absolute inset-0 h-full w-full filter drop-shadow-md"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 2,12 L 2,88 A 48,10 0 0,0 98,88 L 98,12 Z"
                fill={bgColor}
                stroke={borderCol}
                strokeWidth={2}
                className="transition-all duration-200"
              />
              <ellipse
                cx="50"
                cy="12"
                rx="48"
                ry="10"
                fill={bgColor}
                stroke={borderCol}
                strokeWidth={2}
                className="transition-all duration-200"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pt-6 pb-2 px-3">
              <span className="truncate select-none font-semibold text-text-primary text-center w-full text-xs sm:text-sm">
                {data.label}
              </span>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full w-full relative">
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
