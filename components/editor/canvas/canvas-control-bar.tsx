"use client"

import React from "react"
import { ZoomIn, ZoomOut, Maximize, Undo, Redo } from "lucide-react"

interface CanvasControlBarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function CanvasControlBar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasControlBarProps) {
  // Prevent clicks and interactions from interacting with React Flow canvas underneath
  const handlePrevent = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      className="absolute bottom-24 left-6 z-50 flex items-center gap-1 rounded-full border border-border-default/80 bg-bg-elevated/90 p-1.5 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-border-subtle/80 select-none nodrag nopan nowheel"
      onClick={handlePrevent}
      onPointerDown={handlePrevent}
      onMouseDown={handlePrevent}
      onDoubleClick={handlePrevent}
    >
      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onZoomOut}
          title="Zoom out (-)"
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-all duration-200 hover:bg-bg-subtle hover:text-accent-primary active:scale-95 cursor-pointer"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={onFitView}
          title="Fit view"
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-all duration-200 hover:bg-bg-subtle hover:text-accent-primary active:scale-95 cursor-pointer"
        >
          <Maximize className="h-4 w-4" />
        </button>
        <button
          onClick={onZoomIn}
          title="Zoom in (+ / =)"
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-all duration-200 hover:bg-bg-subtle hover:text-accent-primary active:scale-95 cursor-pointer"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Thin Divider */}
      <div className="mx-1 h-4 w-[1px] bg-border-default" />

      {/* History Controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Cmd/Ctrl + Z)"
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-all duration-200 hover:bg-bg-subtle hover:text-accent-primary disabled:pointer-events-none disabled:opacity-40 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Cmd/Ctrl + Shift + Z / Cmd/Ctrl + Y)"
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-all duration-200 hover:bg-bg-subtle hover:text-accent-primary disabled:pointer-events-none disabled:opacity-40 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
