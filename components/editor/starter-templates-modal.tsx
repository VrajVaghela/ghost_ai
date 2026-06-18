"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates"
import { type Node, type Edge } from "@xyflow/react"
import { cn } from "@/lib/utils"

interface TemplatePreviewProps {
  nodes: Node[]
  edges: Edge[]
  className?: string
}

function TemplatePreview({ nodes, edges, className }: TemplatePreviewProps) {
  // Calculate bounding box of all nodes
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach((node) => {
    const x = node.position.x
    const y = node.position.y
    const w = node.style?.width as number || 100
    const h = node.style?.height as number || 50
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x + w > maxX) maxX = x + w
    if (y + h > maxY) maxY = y + h
  })

  // If no nodes, default bounds
  if (minX === Infinity) {
    minX = 0
    minY = 0
    maxX = 100
    maxY = 100
  }

  const padding = 25
  const viewBoxX = minX - padding
  const viewBoxY = minY - padding
  const viewBoxWidth = maxX - minX + padding * 2
  const viewBoxHeight = maxY - minY + padding * 2

  return (
    <div className={cn("relative w-full h-[180px] bg-bg-base bg-[radial-gradient(var(--border-default)_1px,transparent_1px)] [background-size:16px_16px] border border-border-default/50 rounded-xl overflow-hidden flex items-center justify-center p-4", className)}>
      <svg
        viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full object-contain"
      >
        {/* Render Edges first so they are behind nodes */}
        {edges.map((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source)
          const targetNode = nodes.find((n) => n.id === edge.target)
          if (!sourceNode || !targetNode) return null

          const sw = sourceNode.style?.width as number || 100
          const sh = sourceNode.style?.height as number || 50
          const tw = targetNode.style?.width as number || 100
          const th = targetNode.style?.height as number || 50

          const sx = sourceNode.position.x + sw / 2
          const sy = sourceNode.position.y + sh / 2
          const tx = targetNode.position.x + tw / 2
          const ty = targetNode.position.y + th / 2

          return (
            <line
              key={edge.id}
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke="#505060"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          )
        })}

        {/* Render Nodes */}
        {nodes.map((node) => {
          const x = node.position.x
          const y = node.position.y
          const w = node.style?.width as number || 100
          const h = node.style?.height as number || 50
          const data = node.data as any
          const shape = data?.shape || "rectangle"
          const color = data?.color || "rgba(30, 27, 75, 0.85)"
          const resolvedTextColor = data?.textColor || "#EDEDED"
          const borderColor = `${resolvedTextColor}66`

          const renderShape = () => {
            switch (shape) {
              case "rectangle":
                return (
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx={6}
                    fill={color}
                    stroke={borderColor}
                    strokeWidth={1.5}
                  />
                )
              case "circle":
                return (
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx="50%"
                    fill={color}
                    stroke={borderColor}
                    strokeWidth={1.5}
                  />
                )
              case "pill":
                return (
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx={h / 2}
                    fill={color}
                    stroke={borderColor}
                    strokeWidth={1.5}
                  />
                )
              case "diamond": {
                const cx = x + w / 2
                const cy = y + h / 2
                const points = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`
                return (
                  <polygon
                    points={points}
                    fill={color}
                    stroke={borderColor}
                    strokeWidth={1.5}
                  />
                )
              }
              case "hexagon": {
                const cx = x + w / 2
                const cy = y + h / 2
                const points = `
                  ${x + w * 0.25},${y}
                  ${x + w * 0.75},${y}
                  ${x + w},${cy}
                  ${x + w * 0.75},${y + h}
                  ${x + w * 0.25},${y + h}
                  ${x},${cy}
                `.trim().replace(/\s+/g, " ")
                return (
                  <polygon
                    points={points}
                    fill={color}
                    stroke={borderColor}
                    strokeWidth={1.5}
                  />
                )
              }
              case "cylinder": {
                const eh = Math.min(16, h * 0.25)
                const rx = w / 2
                const ry = eh / 2
                const cx = x + w / 2
                const bodyPath = `
                  M ${x} ${y + ry}
                  L ${x} ${y + h - ry}
                  A ${rx} ${ry} 0 0 0 ${x + w} ${y + h - ry}
                  L ${x + w} ${y + ry}
                  Z
                `.trim().replace(/\s+/g, " ")

                return (
                  <g>
                    <path
                      d={bodyPath}
                      fill={color}
                      stroke={borderColor}
                      strokeWidth={1.5}
                    />
                    <ellipse
                      cx={cx}
                      cy={y + ry}
                      rx={rx}
                      ry={ry}
                      fill={color}
                      stroke={borderColor}
                      strokeWidth={1.5}
                    />
                  </g>
                )
              }
              default:
                return (
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx={6}
                    fill={color}
                    stroke={borderColor}
                    strokeWidth={1.5}
                  />
                )
            }
          }

          return (
            <g key={node.id}>
              {renderShape()}
              <text
                x={x + w / 2}
                y={y + h / 2}
                fill={resolvedTextColor}
                fontSize={8}
                fontWeight="semibold"
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none font-sans"
              >
                {data?.label || ""}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

interface StarterTemplatesModalProps {
  open: boolean
  onClose: () => void
  onImport: (template: CanvasTemplate) => void
}

export function StarterTemplatesModal({
  open,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  const [selectedId, setSelectedId] = React.useState<string>(
    CANVAS_TEMPLATES[0]?.id || ""
  )

  const selectedTemplate = CANVAS_TEMPLATES.find((t) => t.id === selectedId) || CANVAS_TEMPLATES[0]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl h-[80vh] max-h-[620px] flex flex-col p-6 overflow-hidden" showCloseButton>
        <DialogHeader className="pb-3 border-b border-border-default/40">
          <DialogTitle>Starter Templates</DialogTitle>
          <DialogDescription>
            Select a pre-built architecture layout to initialize your canvas. This replaces any existing nodes and edges.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row gap-6 mt-5 min-h-0 overflow-hidden">
          {/* Left panel: list of templates */}
          <div className="w-full md:w-[280px] shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pb-3 md:pb-0 md:pr-3 border-b md:border-b-0 md:border-r border-border-default/40 min-h-0">
            {CANVAS_TEMPLATES.map((template) => {
              const isSelected = template.id === selectedId
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className={cn(
                    "relative flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer shrink-0 w-[240px] md:w-auto",
                    isSelected
                      ? "bg-bg-surface border-border-default ring-1 ring-accent-primary/30 text-text-primary"
                      : "bg-transparent border-transparent hover:bg-bg-surface/40 text-text-secondary hover:text-text-primary"
                  )}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-accent-primary" />
                  )}
                  <span className="font-semibold text-sm pl-2 md:pl-1">{template.name}</span>
                  <span className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed pl-2 md:pl-1">
                    {template.description}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right panel: template preview and actions */}
          {selectedTemplate && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex flex-col bg-bg-surface border border-border-default rounded-xl p-5 min-h-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-text-primary tracking-tight">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => onImport(selectedTemplate)}
                    className="w-full sm:w-auto shrink-0 shadow-md bg-accent-primary text-bg-base hover:bg-accent-primary/90 font-semibold cursor-pointer"
                  >
                    Import Template
                  </Button>
                </div>

                <TemplatePreview
                  nodes={selectedTemplate.nodes}
                  edges={selectedTemplate.edges}
                  className="flex-1 min-h-[220px]"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

