import { useEffect } from "react"

export function useKeyboardShortcuts(
  reactFlowInstance: any,
  undo: () => void,
  redo: () => void
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName
        if (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest("[contenteditable='true']") !== null
        ) {
          return
        }
      }

      // Check for Cmd/Ctrl modifier
      const isMod = event.ctrlKey || event.metaKey

      if (isMod) {
        if (event.key.toLowerCase() === "z") {
          event.preventDefault()
          if (event.shiftKey) {
            redo()
          } else {
            undo()
          }
        } else if (event.key.toLowerCase() === "y") {
          event.preventDefault()
          redo()
        }
      } else {
        // Only trigger raw zoom keys if no other modifier (like Shift, Alt, Ctrl) is pressed
        if (!event.altKey && !event.ctrlKey && !event.metaKey) {
          if (event.key === "+" || event.key === "=") {
            event.preventDefault()
            reactFlowInstance.zoomIn({ duration: 150 })
          } else if (event.key === "-") {
            event.preventDefault()
            reactFlowInstance.zoomOut({ duration: 150 })
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [reactFlowInstance, undo, redo])
}
