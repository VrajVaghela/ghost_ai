"use client"

import React from "react"
import { RectangleHorizontal, Diamond, Circle, Pill, Cylinder, Hexagon } from "lucide-react"
import { SHAPE_PALETTES } from "@/types/canvas"

const SHAPES = [
  { name: "rectangle", icon: RectangleHorizontal, width: 120, height: 70, label: "Rectangle" },
  { name: "diamond", icon: Diamond, width: 100, height: 100, label: "Diamond" },
  { name: "circle", icon: Circle, width: 80, height: 80, label: "Circle" },
  { name: "pill", icon: Pill, width: 120, height: 60, label: "Pill" },
  { name: "cylinder", icon: Cylinder, width: 90, height: 80, label: "Cylinder" },
  { name: "hexagon", icon: Hexagon, width: 90, height: 90, label: "Hexagon" },
]

export function ShapeToolbar() {
  const onDragStart = (event: React.DragEvent, shape: string, width: number, height: number) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ shape, width, height })
    )
    event.dataTransfer.effectAllowed = "move"

    // Create a temporary ghost container for the drag preview
    const ghost = document.createElement("div")
    ghost.style.width = `${width}px`
    ghost.style.height = `${height}px`
    ghost.style.position = "fixed"
    ghost.style.left = "-1000px"
    ghost.style.top = "-1000px"
    ghost.style.zIndex = "-1000"
    ghost.style.pointerEvents = "none"

    const palette = SHAPE_PALETTES[shape] || { bg: "rgba(24, 24, 28, 0.85)", border: "#3a3a42" }
    const bgColor = palette.bg
    const borderCol = palette.border

    if (shape === "rectangle" || shape === "circle" || shape === "pill") {
      ghost.style.backgroundColor = bgColor
      ghost.style.border = `1.5px solid ${borderCol}66` // Subtle border at rest
      ghost.style.boxSizing = "border-box"
      if (shape === "rectangle") {
        ghost.style.borderRadius = "8px"
      } else if (shape === "circle" || shape === "pill") {
        ghost.style.borderRadius = "9999px"
      }
    } else {
      let svgContent = ""
      if (shape === "diamond") {
        svgContent = `
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width: 100%; height: 100%;">
            <polygon points="50,2 98,50 50,98 2,50" fill="${bgColor}" stroke="${borderCol}66" stroke-width="1.5" vector-effect="non-scaling-stroke" />
          </svg>
        `
      } else if (shape === "hexagon") {
        svgContent = `
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width: 100%; height: 100%;">
            <polygon points="25,2 75,2 98,50 75,98 25,98 2,50" fill="${bgColor}" stroke="${borderCol}66" stroke-width="1.5" vector-effect="non-scaling-stroke" />
          </svg>
        `
      } else if (shape === "cylinder") {
        svgContent = `
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width: 100%; height: 100%;">
            <path d="M 2,12 L 2,88 A 48,10 0 0,0 98,88 L 98,12 Z" fill="${bgColor}" stroke="${borderCol}66" stroke-width="1.5" vector-effect="non-scaling-stroke" />
            <ellipse cx="50" cy="12" rx="48" ry="10" fill="${bgColor}" stroke="${borderCol}66" stroke-width="1.5" vector-effect="non-scaling-stroke" />
          </svg>
        `
      }
      ghost.innerHTML = svgContent
    }

    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(ghost, width / 2, height / 2)

    setTimeout(() => {
      if (document.body.contains(ghost)) {
        document.body.removeChild(ghost)
      }
    }, 0)
  }

  return (
    <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border-default/80 bg-bg-elevated/90 px-4 py-2 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-border-subtle/80 select-none">
      {SHAPES.map(({ name, icon: Icon, width, height, label }) => (
        <div
          key={name}
          draggable
          onDragStart={(e) => onDragStart(e, name, width, height)}
          title={`Drag ${label} to canvas`}
          className="group relative flex h-10 w-10 cursor-grab items-center justify-center rounded-full text-text-secondary transition-all duration-200 hover:scale-110 hover:bg-bg-subtle hover:text-accent-primary active:cursor-grabbing active:scale-95"
        >
          <Icon className="h-5 w-5 transition-transform duration-200 group-hover:rotate-3" />
          
          {/* Custom micro-animated tooltip */}
          <span className="pointer-events-none absolute -top-8 scale-90 rounded bg-bg-surface border border-border-default px-2 py-0.5 text-[10px] font-medium text-text-secondary opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap shadow-lg">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
