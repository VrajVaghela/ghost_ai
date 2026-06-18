import { task } from "@trigger.dev/sdk";
import { getLiveblocks } from "@/lib/liveblocks";
import { LiveObject, LiveMap, LiveList } from "@liveblocks/node";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

// Initialize Gemini provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

const ALLOWED_SHAPES = ["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"] as const;

const NODE_COLORS = [
  { bg: "#1F1F1F", text: "#EDEDED" }, // Neutral dark
  { bg: "#10233D", text: "#52A8FF" }, // Blue
  { bg: "#2E1938", text: "#BF7AF0" }, // Purple
  { bg: "#331B00", text: "#FF990A" }, // Orange
  { bg: "#3C1618", text: "#FF6166" }, // Red
  { bg: "#3A1726", text: "#F75F8F" }, // Pink
  { bg: "#0F2E18", text: "#62C073" }, // Green
  { bg: "#062822", text: "#0AC7B4" }, // Teal
];

// Helper to update AI presence in the Liveblocks room
async function updateAiPresence(
  roomId: string,
  status: string,
  cursor: { x: number; y: number } | null = null,
  thinking: boolean = true
) {
  const lb = getLiveblocks();
  try {
    await lb.setPresence(roomId, {
      userId: "ai-agent",
      data: {
        cursor,
        thinking,
        status,
      },
      userInfo: {
        name: "Ghost AI",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ghost",
        color: "#BF7AF0", // Purple theme indicator color
      },
      ttl: 60, // expire in 60s if agent crashes
    });
  } catch (error) {
    console.error("Error setting AI presence:", error);
  }
}

// Helper to push a status log to the shared status feed inside Liveblocks storage
async function pushStatusMessage(
  roomId: string,
  message: string,
  type: "info" | "success" | "error" = "info"
) {
  const lb = getLiveblocks();
  try {
    await lb.mutateStorage(roomId, ({ root }) => {
      // Update legacy statusFeed
      let feed = root.get("statusFeed") as any;
      if (!feed) {
        root.set("statusFeed", new LiveList([]));
        feed = root.get("statusFeed");
      }
      feed.push(
        new LiveObject({
          id: `status-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          message,
          timestamp: Date.now(),
          type,
        })
      );

      // Update new ai-status-feed
      let aiFeed = root.get("ai-status-feed") as any;
      if (!aiFeed) {
        root.set("ai-status-feed", new LiveList([]));
        aiFeed = root.get("ai-status-feed");
      }
      aiFeed.push(
        new LiveObject({
          id: `ai-status-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          message,
          timestamp: Date.now(),
          type,
          text: message,
        })
      );
    });
  } catch (error) {
    console.error("Error pushing status message:", error);
  }
}

export const designAgentTask = task({
  id: "design-agent",
  run: async (payload: { prompt: string; roomId: string }) => {
    const { prompt, roomId } = payload;

    console.log("Starting design agent task", { prompt, roomId });

    // 1. Initialize presence and clear status feed
    await updateAiPresence(roomId, "Ghost AI is starting...");
    const lb = getLiveblocks();
    try {
      await lb.mutateStorage(roomId, ({ root }) => {
        root.set("statusFeed", new LiveList([]));
        root.set("ai-status-feed", new LiveList([]));
      });
    } catch (e) {
      console.error("Failed to reset status feed:", e);
    }

    await pushStatusMessage(roomId, "Initializing Ghost AI design agent...", "info");

    try {
      // 2. Fetch current canvas state
      await updateAiPresence(roomId, "Reading current canvas state...");
      await pushStatusMessage(roomId, "Retrieving active canvas architecture...", "info");

      const storage = await lb.getStorageDocument(roomId, "json");
      const flow = (storage as any).flow || { nodes: {}, edges: {} };
      const currentNodes = Object.values(flow.nodes || {});
      const currentEdges = Object.values(flow.edges || {});

      console.log(`Retrieved ${currentNodes.length} nodes and ${currentEdges.length} edges.`);

      // 3. Prompt Gemini with prompt and current state
      await updateAiPresence(roomId, "Analyzing layout with Gemini...");
      await pushStatusMessage(roomId, "Asking Gemini to calculate system layout changes...", "info");

      const systemPrompt = `You are a collaborative system design assistant. Your task is to modify the collaborative system architecture graph based on the user's natural language instructions.

You can add new nodes and edges, move existing nodes, resize nodes, update node labels/colors/shapes, and delete nodes/edges.

ALLOWED SHAPES:
- "rectangle": standard rectangular box, default size 150x80. Use for general services, apps, APIs.
- "diamond": diamond shape, default size 100x100. Use for decision points, routers, gateway paths.
- "circle": circular node, default size 90x90. Circles MUST keep aspect ratio (width == height). Use for users, load balancers, simple starting points.
- "pill": rounded pill, default size 120x50. Use for external interfaces, clients, message queues.
- "cylinder": database cylinder, default size 100x120. Use for database, cache, storage nodes.
- "hexagon": hexagon shape, default size 110x100. Use for workers, microservices, external APIs.

ALLOWED NODE COLOR PAIRS (bg and text):
- Neutral dark: bg "#1F1F1F", text "#EDEDED"
- Blue: bg "#10233D", text "#52A8FF"
- Purple: bg "#2E1938", text "#BF7AF0"
- Orange: bg "#331B00", text "#FF990A"
- Red: bg "#3C1618", text "#FF6166"
- Pink: bg "#3A1726", text "#F75F8F"
- Green: bg "#0F2E18", text "#62C073"
- Teal: bg "#062822", text "#0AC7B4"

Ensure you use these exact hex codes for node color properties (color = bg, textColor = text).

LAYOUT AND SPACING RULES:
- Lay out nodes in a clear flow structure (e.g. left-to-right or top-to-bottom flow).
- Keep at least 150 to 250 pixels of space between nodes to ensure clarity. Do not overlap nodes.
- When creating connection edges, specify the matching 'sourceHandle' and 'targetHandle' on the nodes.
  Available handles on any node are:
  - top: 'top-source' (source) and 'top-target' (target)
  - bottom: 'bottom-source' (source) and 'bottom-target' (target)
  - left: 'left-source' (source) and 'left-target' (target)
  - right: 'right-source' (source) and 'right-target' (target)
  Connect from source handles (e.g. 'right-source') to target handles (e.g. 'left-target') based on relative position.

Analyze the current state of the canvas. You must output the entire final desired state of the canvas (nodes and edges). If the user asks to add to, modify, or delete elements, do so by returning the modified lists. All existing elements that are NOT modified or deleted should still be included in the output.`;

      const userContextPrompt = `Current nodes:
${JSON.stringify(currentNodes, null, 2)}

Current edges:
${JSON.stringify(currentEdges, null, 2)}

User request:
"${prompt}"

Please respond with the final list of nodes and edges.`;

      const result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: z.object({
          nodes: z.array(
            z.object({
              id: z.string(),
              label: z.string(),
              shape: z.enum(ALLOWED_SHAPES),
              color: z.string(),
              textColor: z.string(),
              x: z.number(),
              y: z.number(),
              width: z.number(),
              height: z.number(),
            })
          ),
          edges: z.array(
            z.object({
              id: z.string(),
              source: z.string(),
              target: z.string(),
              label: z.string().optional(),
              sourceHandle: z.enum(["top-source", "bottom-source", "left-source", "right-source"]),
              targetHandle: z.enum(["top-target", "bottom-target", "left-target", "right-target"]),
            })
          ),
        }),
        prompt: userContextPrompt,
        system: systemPrompt,
      });

      const parsedResult = result.object;
      console.log("Gemini response parsed successfully", parsedResult);

      // 4. Validate output
      const validNodes = parsedResult.nodes.map((n) => {
        // Find if color matches a valid pair
        const hasValidColor = NODE_COLORS.some(
          (c) => c.bg.toLowerCase() === n.color.toLowerCase()
        );
        let color = n.color;
        let textColor = n.textColor;
        if (!hasValidColor) {
          // Fallback to neutral dark
          color = "#1F1F1F";
          textColor = "#EDEDED";
        }

        // Handle minimum limits
        const width = Math.max(50, n.width);
        const height = Math.max(40, n.height);

        return {
          id: n.id,
          type: "canvasNode",
          position: { x: n.x, y: n.y },
          data: {
            label: n.label,
            shape: n.shape,
            color,
            textColor,
          },
          style: {
            width: n.shape === "circle" ? Math.max(width, height) : width,
            height: n.shape === "circle" ? Math.max(width, height) : height,
          },
        };
      });

      const validNodeIds = new Set(validNodes.map((n) => n.id));

      const validEdges = parsedResult.edges
        .filter((e) => validNodeIds.has(e.source) && validNodeIds.has(e.target))
        .map((e) => ({
          id: e.id,
          type: "canvasEdge",
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          data: {
            label: e.label || "",
          },
        }));

      // 5. Simulate cursor movements while applying the nodes
      await pushStatusMessage(roomId, "Drawing canvas architecture...", "info");

      for (const node of validNodes) {
        const xCoord = node.position.x + (node.style.width / 2);
        const yCoord = node.position.y + (node.style.height / 2);

        await updateAiPresence(roomId, `Drawing node: ${node.data.label || node.id}`, { x: xCoord, y: yCoord }, true);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      await updateAiPresence(roomId, "Routing connections...");
      await pushStatusMessage(roomId, "Routing connections and edges...", "info");

      for (const edge of validEdges) {
        const sourceNode = validNodes.find((n) => n.id === edge.source);
        const targetNode = validNodes.find((n) => n.id === edge.target);
        if (sourceNode && targetNode) {
          const x = (sourceNode.position.x + targetNode.position.x) / 2;
          const y = (sourceNode.position.y + targetNode.position.y) / 2;
          await updateAiPresence(roomId, `Connecting: ${sourceNode.data.label} to ${targetNode.data.label}`, { x, y }, true);
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      // 6. Mutate storage to update canvas
      await updateAiPresence(roomId, "Updating canvas storage...");
      await lb.mutateStorage(roomId, ({ root }) => {
        let flowObj = root.get("flow") as any;
        if (!flowObj) {
          root.set(
            "flow",
            new LiveObject({
              nodes: new LiveMap(),
              edges: new LiveMap(),
            })
          );
          flowObj = root.get("flow");
        }

        let nodesMap = flowObj.get("nodes");
        if (!nodesMap) {
          flowObj.set("nodes", new LiveMap());
          nodesMap = flowObj.get("nodes");
        }

        let edgesMap = flowObj.get("edges");
        if (!edgesMap) {
          flowObj.set("edges", new LiveMap());
          edgesMap = flowObj.get("edges");
        }

        // Apply node updates
        const targetNodeIds = new Set(validNodes.map((n) => n.id));
        const currentNodeIds = Array.from(nodesMap.keys()) as string[];

        // Delete removed nodes
        for (const id of currentNodeIds) {
          if (!targetNodeIds.has(id)) {
            nodesMap.delete(id);
          }
        }

        // Add or update nodes
        for (const node of validNodes) {
          const existing = nodesMap.get(node.id);
          if (existing) {
            existing.set("position", new LiveObject(node.position));
            existing.set("data", new LiveObject(node.data));
            existing.set("style", new LiveObject(node.style));
            existing.set("type", node.type);
          } else {
            nodesMap.set(
              node.id,
              new LiveObject({
                id: node.id,
                type: node.type,
                position: new LiveObject(node.position),
                data: new LiveObject(node.data),
                style: new LiveObject(node.style),
              })
            );
          }
        }

        // Apply edge updates
        const targetEdgeIds = new Set(validEdges.map((e) => e.id));
        const currentEdgeIds = Array.from(edgesMap.keys()) as string[];

        // Delete removed edges
        for (const id of currentEdgeIds) {
          if (!targetEdgeIds.has(id)) {
            edgesMap.delete(id);
          }
        }

        // Add or update edges
        for (const edge of validEdges) {
          const existing = edgesMap.get(edge.id);
          if (existing) {
            existing.set("source", edge.source);
            existing.set("target", edge.target);
            existing.set("sourceHandle", edge.sourceHandle);
            existing.set("targetHandle", edge.targetHandle);
            existing.set("data", new LiveObject(edge.data));
            existing.set("type", edge.type);
          } else {
            edgesMap.set(
              edge.id,
              new LiveObject({
                id: edge.id,
                type: edge.type,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
                data: new LiveObject(edge.data),
              })
            );
          }
        }
      });

      await pushStatusMessage(roomId, "Canvas successfully updated!", "success");
      await updateAiPresence(roomId, "Design complete!", null, false);

      // Wait a few seconds to let user see "Design complete!" in presence, then clear it
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await lb.setPresence(roomId, {
        userId: "ai-agent",
        data: {
          cursor: null,
          thinking: false,
          status: "",
        },
        userInfo: {
          name: "Ghost AI",
          avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ghost",
          color: "#BF7AF0",
        },
        ttl: 2, // expire immediately
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error running design agent task:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await pushStatusMessage(roomId, `Error: ${errorMessage}`, "error");

      // Set presence to error and clear thinking
      try {
        await lb.setPresence(roomId, {
          userId: "ai-agent",
          data: {
            cursor: null,
            thinking: false,
            status: "Error occurred",
          },
          userInfo: {
            name: "Ghost AI",
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ghost",
            color: "#BF7AF0",
          },
          ttl: 10,
        });
      } catch (e) {
        console.error("Failed to report presence error:", e);
      }

      throw error;
    }
  },
});
