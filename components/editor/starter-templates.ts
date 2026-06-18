import { type Node, type Edge } from "@xyflow/react"
import { NODE_COLORS } from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: Node[]
  edges: Edge[]
}

// Helpers to quickly define template nodes & edges with defaults
function createTemplateNode(
  id: string,
  label: string,
  shape: string,
  colorIndex: number, // 0 to 7 mapping to NODE_COLORS
  x: number,
  y: number,
  width: number,
  height: number
): Node {
  const colorPair = NODE_COLORS[colorIndex] || NODE_COLORS[0]
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: {
      label,
      color: colorPair.bg,
      textColor: colorPair.text,
      shape,
    },
    style: {
      width,
      height,
    },
  }
}

function createTemplateEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string,
  label: string = ""
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: "canvasEdge",
    data: {
      label,
    },
  }
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices Architecture",
    description: "A standard API Gateway pattern routing requests to specialized backend microservices and databases.",
    nodes: [
      createTemplateNode("api-gateway", "API Gateway", "rectangle", 1, 50, 150, 140, 70),
      createTemplateNode("auth-service", "Auth Service", "pill", 2, 280, 50, 130, 50),
      createTemplateNode("order-service", "Order Service", "rectangle", 3, 280, 150, 140, 70),
      createTemplateNode("payment-service", "Payment Service", "rectangle", 7, 280, 260, 140, 70),
      createTemplateNode("orders-db", "Orders DB", "cylinder", 6, 520, 145, 100, 80),
      createTemplateNode("stripe-api", "Stripe API", "hexagon", 1, 520, 260, 110, 70),
    ],
    edges: [
      createTemplateEdge("e1", "api-gateway", "auth-service", "right-source", "left-target", "Verify JWT"),
      createTemplateEdge("e2", "api-gateway", "order-service", "right-source", "left-target", "Create Order"),
      createTemplateEdge("e3", "api-gateway", "payment-service", "right-source", "left-target", "Process Pay"),
      createTemplateEdge("e4", "order-service", "orders-db", "right-source", "left-target", "Store"),
      createTemplateEdge("e5", "payment-service", "stripe-api", "right-source", "left-target", "External SDK"),
    ]
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description: "A continuous integration and deployment pipeline with manual approval gates and failure notification nodes.",
    nodes: [
      createTemplateNode("git-push", "Git Push", "circle", 1, 50, 110, 80, 80),
      createTemplateNode("lint-test", "Lint & Test", "rectangle", 2, 200, 120, 130, 60),
      createTemplateNode("docker-build", "Docker Build", "rectangle", 7, 400, 120, 130, 60),
      createTemplateNode("approval-gate", "Approve?", "diamond", 3, 600, 105, 120, 90),
      createTemplateNode("deploy-prod", "Deploy Prod", "pill", 6, 800, 125, 130, 50),
      createTemplateNode("slack-alert", "Notify Slack", "hexagon", 4, 605, 260, 110, 70),
    ],
    edges: [
      createTemplateEdge("e1", "git-push", "lint-test", "right-source", "left-target", "Trigger"),
      createTemplateEdge("e2", "lint-test", "docker-build", "right-source", "left-target", "Pass"),
      createTemplateEdge("e3", "docker-build", "approval-gate", "right-source", "left-target", "Push Image"),
      createTemplateEdge("e4", "approval-gate", "deploy-prod", "right-source", "left-target", "Yes"),
      createTemplateEdge("e5", "approval-gate", "slack-alert", "bottom-source", "top-target", "No / Fail"),
    ]
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description: "An asynchronous pub/sub architecture handling ingestion and message fan-out to parallel workers.",
    nodes: [
      createTemplateNode("client-app", "Client App", "rectangle", 1, 50, 120, 130, 60),
      createTemplateNode("ingest-api", "Ingest API", "rectangle", 2, 250, 120, 130, 60),
      createTemplateNode("kafka-topic", "Kafka Topic", "cylinder", 3, 460, 110, 110, 80),
      createTemplateNode("email-worker", "Email Worker", "rectangle", 7, 670, 40, 130, 60),
      createTemplateNode("analytics-db", "Analytics DB", "rectangle", 7, 670, 200, 130, 60),
    ],
    edges: [
      createTemplateEdge("e1", "client-app", "ingest-api", "right-source", "left-target", "HTTP POST"),
      createTemplateEdge("e2", "ingest-api", "kafka-topic", "right-source", "left-target", "Publish"),
      createTemplateEdge("e3", "kafka-topic", "email-worker", "right-source", "left-target", "Subscribe"),
      createTemplateEdge("e4", "kafka-topic", "analytics-db", "right-source", "left-target", "Subscribe"),
    ]
  }
]
