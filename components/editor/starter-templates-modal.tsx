"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates"
import { type Node, type Edge } from "@xyflow/react"

interface TemplatePreviewProps {
  nodes: Node[]
  edges: Edge[]
}

function TemplatePreview({ nodes, edges }: TemplatePreviewProps) {
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
    <div className="relative w-full h-[160px] bg-bg-base border border-border-default/50 rounded-lg overflow-hidden flex items-center justify-center p-2">
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
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-6" showCloseButton>
        <DialogHeader>
          <DialogTitle>Starter Templates</DialogTitle>
          <DialogDescription>
            Select a pre-built architecture layout to initialize your canvas. This replaces any existing nodes and edges.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 mt-4 pr-3 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            {CANVAS_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className="flex flex-col h-full bg-bg-surface border border-border-default hover:border-border-muted transition-colors"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-text-primary">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2 min-h-[32px] text-text-secondary">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <TemplatePreview nodes={template.nodes} edges={template.edges} />
                </CardContent>
                <CardFooter className="pt-3 border-t border-border-default/30 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => onImport(template)}
                  >
                    Import Template
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
