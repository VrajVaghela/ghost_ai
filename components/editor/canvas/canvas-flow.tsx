"use client"

import React, { useCallback, useRef, useState, useEffect } from "react"
import { ReactFlow, MiniMap, Background, BackgroundVariant, ConnectionMode, useReactFlow } from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useUndo, useRedo, useCanUndo, useCanRedo, useUpdateMyPresence, useRoom } from "@liveblocks/react"
import { CanvasNode } from "./canvas-node"
import { CanvasEdge } from "./canvas-edge"
import { ShapeToolbar } from "./shape-toolbar"
import { CanvasControlBar } from "./canvas-control-bar"
import { CollaboratorCursors } from "./collaborator-cursors"
import { PresenceAvatars } from "./presence-avatars"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { getDefaultColorForShape } from "@/types/canvas"
import { StarterTemplatesModal } from "../starter-templates-modal"
import { type CanvasTemplate } from "../starter-templates"
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

const nodeTypes = {
  canvasNode: CanvasNode,
}

const edgeTypes = {
  canvasEdge: CanvasEdge,
}

export function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const reactFlow = useReactFlow()
  const { screenToFlowPosition } = reactFlow
  const counterRef = useRef(0)

  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const updateMyPresence = useUpdateMyPresence()

  const room = useRoom()
  const projectId = room.id

  // Hook handles debounced autosaving and manual saving
  useCanvasAutosave(projectId, nodes, edges)

  const [hasCheckedLoad, setHasCheckedLoad] = useState(false)

  // Load saved canvas state if the room is empty
  useEffect(() => {
    if (hasCheckedLoad) return

    const loadSavedCanvas = async () => {
      if (nodes.length === 0 && edges.length === 0) {
        try {
          const res = await fetch(`/api/projects/${projectId}/canvas`)
          if (res.ok) {
            const data = await res.json()
            if (data && (data.nodes || data.edges)) {
              // Load state
              reactFlow.setNodes(data.nodes || [])
              reactFlow.setEdges(data.edges || [])
              
              // Dispatch loaded event to sync prevDataRef in the hook
              window.dispatchEvent(
                new CustomEvent("canvas-loaded", { detail: data })
              )

              // Wait brief moment, then fit view
              setTimeout(() => {
                reactFlow.fitView({ duration: 200 })
              }, 50)
            }
          }
        } catch (e) {
          console.error("Error loading saved canvas:", e)
        }
      }
      setHasCheckedLoad(true)
    }

    loadSavedCanvas()
  }, [nodes.length, edges.length, projectId, reactFlow, hasCheckedLoad])

  // Register keyboard shortcuts hook
  useKeyboardShortcuts(reactFlow, undo, redo)

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      updateMyPresence({ cursor: position })
    },
    [reactFlow, updateMyPresence]
  )

  const onMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsTemplatesModalOpen(true)
    window.addEventListener("open-starter-templates", handleOpen)
    return () => window.removeEventListener("open-starter-templates", handleOpen)
  }, [])

  useEffect(() => {
    const handleSpecStateRequest = (event: Event) => {
      const detail = (event as CustomEvent<{ requestId?: string }>).detail
      window.dispatchEvent(
        new CustomEvent("canvas-spec-state-response", {
          detail: {
            requestId: detail?.requestId,
            nodes,
            edges,
          },
        })
      )
    }

    window.addEventListener("canvas-spec-state-request", handleSpecStateRequest)
    return () =>
      window.removeEventListener("canvas-spec-state-request", handleSpecStateRequest)
  }, [nodes, edges])

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      reactFlow.setNodes(template.nodes)
      reactFlow.setEdges(template.edges)
      setIsTemplatesModalOpen(false)
      setTimeout(() => {
        reactFlow.fitView({ duration: 200 })
      }, 50)
    },
    [reactFlow]
  )

  const handleZoomIn = useCallback(() => {
    reactFlow.zoomIn({ duration: 150 })
  }, [reactFlow])

  const handleZoomOut = useCallback(() => {
    reactFlow.zoomOut({ duration: 150 })
  }, [reactFlow])

  const handleFitView = useCallback(() => {
    reactFlow.fitView({ duration: 150 })
  }, [reactFlow])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const payload = event.dataTransfer.getData("application/reactflow")
      if (!payload) return

      try {
        const { shape, width, height } = JSON.parse(payload)

        // Convert client screen coordinates to flow canvas coordinates
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })

        // Center the shape on the drop coordinates
        const centeredPosition = {
          x: position.x - width / 2,
          y: position.y - height / 2,
        }

        // Generate node ID: shape-timestamp-counter
        const nodeId = `${shape}-${Date.now()}-${counterRef.current++}`

        const newNode = {
          id: nodeId,
          type: "canvasNode",
          position: centeredPosition,
          data: {
            label: "",
            color: getDefaultColorForShape(shape), // Default color based on shape
            shape: shape,
          },
          style: {
            width,
            height,
          },
        }

        // Add node via Liveblocks-wrapped onNodesChange
        onNodesChange([{ type: "add", item: newNode } as any])
      } catch (err) {
        console.error("Failed to parse dropped shape data:", err)
      }
    },
    [screenToFlowPosition, onNodesChange]
  )

  return (
    <div 
      className="relative h-full w-full" 
      onDragOver={onDragOver} 
      onDrop={onDrop}
    >
      {/* Global SVG definitions for custom edge arrowheads */}
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
        <defs>
          <marker
            id="arrow-rest"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#505060" />
          </marker>
          <marker
            id="arrow-hover"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#c0c0cc" />
          </marker>
          <marker
            id="arrow-selected"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
          </marker>
        </defs>
      </svg>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "canvasEdge",
        }}
        connectionMode={ConnectionMode.Loose}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        fitView
      >
        <MiniMap
          nodeColor="#18181c"
          nodeStrokeColor="#3a3a42"
          maskColor="rgba(8,8,9,0.7)"
          style={{ backgroundColor: "#111114", border: "1px solid #2a2a30" }}
        />
        <Background variant={BackgroundVariant.Dots} color="#2a2a30" gap={20} size={1} />
        <CollaboratorCursors />
      </ReactFlow>

      {/* Floating pill-shaped toolbar */}
      <ShapeToolbar />

      {/* Canvas Control Bar */}
      <CanvasControlBar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Presence Avatars overlay */}
      <PresenceAvatars />

      <StarterTemplatesModal
        open={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onImport={handleImportTemplate}
      />
    </div>
  )
}
