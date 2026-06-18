import { useEffect, useState, useRef, useCallback } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface CanvasData {
  nodes: any[];
  edges: any[];
}

export function useCanvasAutosave(projectId: string, nodes: any[], edges: any[]) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const statusRef = useRef<SaveStatus>("idle");
  const isInitialLoadRef = useRef(true);
  const prevDataRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep statusRef in sync with status
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Helper to notify other parts of the app
  const updateStatus = useCallback((newStatus: SaveStatus) => {
    setStatus(newStatus);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("canvas-save-status", {
          detail: { status: newStatus },
        })
      );
    }
  }, []);

  const saveCanvas = useCallback(async (dataStr: string) => {
    updateStatus("saving");
    try {
      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: dataStr,
      });

      if (!response.ok) {
        throw new Error("Failed to save canvas");
      }

      updateStatus("saved");
      prevDataRef.current = dataStr;

      // Reset to idle after a delay if status hasn't changed
      const idleTimeout = setTimeout(() => {
        if (statusRef.current === "saved") {
          updateStatus("idle");
        }
      }, 2000);
      
      return () => clearTimeout(idleTimeout);
    } catch (err) {
      console.error("Autosave error:", err);
      updateStatus("error");
    }
  }, [projectId, updateStatus]);

  // Debounced autosave
  useEffect(() => {
    const currentDataStr = JSON.stringify({ nodes, edges });

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevDataRef.current = currentDataStr;
      return;
    }

    // Skip if data hasn't changed
    if (currentDataStr === prevDataRef.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    updateStatus("saving");

    timeoutRef.current = setTimeout(() => {
      saveCanvas(currentDataStr);
    }, 2000); // 2 seconds debounce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [nodes, edges, saveCanvas, updateStatus]);

  // Handle canvas load to avoid immediate autosave
  useEffect(() => {
    const handleLoaded = (e: Event) => {
      const data = (e as CustomEvent).detail as CanvasData;
      prevDataRef.current = JSON.stringify({
        nodes: data.nodes || [],
        edges: data.edges || [],
      });
      // Also ensure initial load ref is set to false
      isInitialLoadRef.current = false;
    };

    window.addEventListener("canvas-loaded", handleLoaded);
    return () => {
      window.removeEventListener("canvas-loaded", handleLoaded);
    };
  }, []);

  // Manual save handler
  useEffect(() => {
    const handleManual = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      const currentDataStr = JSON.stringify({ nodes, edges });
      saveCanvas(currentDataStr);
    };

    window.addEventListener("canvas-manual-save", handleManual);
    return () => {
      window.removeEventListener("canvas-manual-save", handleManual);
    };
  }, [nodes, edges, saveCanvas]);

  return { status };
}
