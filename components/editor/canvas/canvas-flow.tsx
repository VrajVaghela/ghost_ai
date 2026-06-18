"use client"

import { ReactFlow, MiniMap, Background, BackgroundVariant, ConnectionMode } from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

export function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
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
    </div>
  )
}
