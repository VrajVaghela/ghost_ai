export type NodeData = {
  label: string
  color?: string
  shape?: string
}

export type CanvasNodeType = "canvasNode"
export type CanvasEdgeType = "canvasEdge"

export const SHAPE_PALETTES: Record<string, { bg: string; border: string }> = {
  rectangle: { bg: "rgba(30, 27, 75, 0.85)", border: "#6366f1" }, // Indigo
  diamond: { bg: "rgba(6, 78, 59, 0.85)", border: "#10b981" },   // Emerald
  circle: { bg: "rgba(69, 26, 3, 0.85)", border: "#f59e0b" },    // Amber
  pill: { bg: "rgba(76, 5, 25, 0.85)", border: "#f43f5e" },      // Rose
  cylinder: { bg: "rgba(12, 74, 110, 0.85)", border: "#0ea5e9" },  // Sky
  hexagon: { bg: "rgba(59, 7, 100, 0.85)", border: "#a855f7" },   // Violet
}

export function getDefaultColorForShape(shape: string): string {
  return SHAPE_PALETTES[shape]?.bg || "#18181c"
}

