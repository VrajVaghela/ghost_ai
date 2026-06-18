"use client"

import React, { useCallback, useRef } from "react"
import { ReactFlow, MiniMap, Background, BackgroundVariant, ConnectionMode, useReactFlow } from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { CanvasNode } from "./canvas-node"
import { ShapeToolbar } from "./shape-toolbar"
import { getDefaultColorForShape } from "@/types/canvas"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

const nodeTypes = {
  canvasNode: CanvasNode,
}

export function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const { screenToFlowPosition } = useReactFlow()
  const counterRef = useRef(0)

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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <MiniMap
          nodeColor="#18181c"
          nodeStrokeColor="#3a3a42"
          maskColor="rgba(8,8,9,0.7)"
          style={{ backgroundColor: "#111114", border: "1px solid #2a2a30" }}
        />
        <Background variant={BackgroundVariant.Dots} color="#2a2a30" gap={20} size={1} />
      </ReactFlow>

      {/* Floating pill-shaped toolbar */}
      <ShapeToolbar />
    </div>
  )
}
