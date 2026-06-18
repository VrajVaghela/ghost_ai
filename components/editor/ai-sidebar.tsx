"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Bot, X, Send, Sparkles, FileText, Download, Loader2, AlertCircle, FileStack, RefreshCw } from "lucide-react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStorage, useOthers, useMutation, useSelf } from "@liveblocks/react"
import { LiveList, LiveObject } from "@liveblocks/client"
import type { designAgentTask } from "@/trigger/design-agent"
import type { generateSpec } from "@/trigger/generate-spec"
import {
  AiStatusMessageSchema,
  AiChatMessageSchema,
  type AiStatusMessage,
  type AiChatMessage,
} from "@/types/tasks"

interface AISidebarProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

type ProjectSpecMetadata = {
  id: string
  filename: string
  createdAt: string
}

type CanvasSpecState = {
  nodes: unknown[]
  edges: unknown[]
}

export function AISidebar({ isOpen, onClose, projectId }: AISidebarProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const [specs, setSpecs] = useState<ProjectSpecMetadata[]>([])
  const [isSpecsLoading, setIsSpecsLoading] = useState(false)
  const [specsError, setSpecsError] = useState<string | null>(null)
  const [selectedSpec, setSelectedSpec] = useState<ProjectSpecMetadata | null>(null)
  const [specContent, setSpecContent] = useState("")
  const [isSpecPreviewLoading, setIsSpecPreviewLoading] = useState(false)
  const [specPreviewError, setSpecPreviewError] = useState<string | null>(null)
  const [specRunId, setSpecRunId] = useState<string | null>(null)
  const [specPublicToken, setSpecPublicToken] = useState<string | null>(null)
  const [isSpecGenerating, setIsSpecGenerating] = useState(false)
  const [specGenerateError, setSpecGenerateError] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Current user identity for labelling chat messages
  const self = useSelf()
  const senderName = self?.info?.name ?? self?.id ?? "You"

  // Liveblocks presence and storage queries
  const others = useOthers()
  const aiCollaborator = others.find((other) => other.id === "ai-agent")
  const isAiThinking = aiCollaborator?.presence?.thinking ?? false
  const aiStatus = aiCollaborator?.presence?.status ?? ""

  const rawStatusFeed = useStorage((root) => root["ai-status-feed"])
  const rawChatFeed = useStorage((root) => root["ai-chat"])

  // Validate status feed — most recent valid entry
  let latestStatusMessage: AiStatusMessage | null = null
  if (rawStatusFeed && rawStatusFeed.length > 0) {
    for (let i = rawStatusFeed.length - 1; i >= 0; i--) {
      const parsed = AiStatusMessageSchema.safeParse(rawStatusFeed[i])
      if (parsed.success) {
        latestStatusMessage = parsed.data
        break
      }
    }
  }

  // Validate and collect all chat messages in order
  const messages: AiChatMessage[] = []
  if (rawChatFeed) {
    for (let i = 0; i < rawChatFeed.length; i++) {
      const parsed = AiChatMessageSchema.safeParse(rawChatFeed[i])
      if (parsed.success) {
        messages.push(parsed.data)
      }
    }
  }

  // Mutation: append a message to the ai-chat feed
  const appendChatMessage = useMutation(
    ({ storage }, msg: AiChatMessage) => {
      let feed = storage.get("ai-chat")
      if (!feed) {
        storage.set("ai-chat", new LiveList([]))
        feed = storage.get("ai-chat")!
      }
      feed.push(
        new LiveObject({
          id: msg.id,
          sender: msg.sender,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })
      )
    },
    []
  )

  // Track the triggered AI design run in real time. The hook stays inert until
  // a runId + publicToken are available (enabled toggles the subscription).
  const { run: realtimeRun } = useRealtimeRun<typeof designAgentTask>(runId ?? "", {
    accessToken: publicToken ?? "",
    enabled: Boolean(runId && publicToken),
    onComplete: (completedRun, error) => {
      const now = Date.now()
      const failed =
        Boolean(error) ||
        completedRun?.status === "FAILED" ||
        completedRun?.status === "CRASHED" ||
        completedRun?.status === "CANCELED" ||
        completedRun?.status === "TIMED_OUT"

      appendChatMessage({
        id: `msg-${now}-assistant`,
        sender: "Ghost AI",
        role: "assistant",
        content: failed
          ? `An error occurred during design generation: ${
              error?.message ?? "the design run did not complete successfully."
            }`
          : "I have successfully generated the architecture nodes and connections on the canvas. Let me know if you would like me to make any modifications!",
        timestamp: now,
      })

      // Reset loading + run state once the run reaches a terminal state.
      setRunId(null)
      setPublicToken(null)
      setIsLoading(false)
    },
  })

  useRealtimeRun<typeof generateSpec>(specRunId ?? "", {
    accessToken: specPublicToken ?? "",
    enabled: Boolean(specRunId && specPublicToken),
    onComplete: (_completedRun, error) => {
      setSpecRunId(null)
      setSpecPublicToken(null)
      setIsSpecGenerating(false)

      if (error) {
        setSpecGenerateError(error.message || "Spec generation failed.")
        return
      }

      loadSpecs()
    },
  })

  // A run is active from the moment it is triggered until it reaches a
  // terminal state (at which point runId is cleared in onComplete).
  const isRunActive = Boolean(runId)

  // Input/controls are busy while submitting, while our own run is active, or
  // while any collaborator's AI run is thinking (driven by shared presence).
  const isBusy = isLoading || isRunActive || isAiThinking

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const loadSpecs = useCallback(async () => {
    if (!projectId) return

    setIsSpecsLoading(true)
    setSpecsError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/specs`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to load specs (${res.status})`)
      }

      const data = (await res.json()) as { specs?: ProjectSpecMetadata[] }
      setSpecs(Array.isArray(data.specs) ? data.specs : [])
    } catch (err) {
      setSpecsError(err instanceof Error ? err.message : "Failed to load specs")
      setSpecs([])
    } finally {
      setIsSpecsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (!isOpen || !projectId) return
    loadSpecs()
  }, [isOpen, projectId, loadSpecs])

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim()
    if (!text || isBusy) return

    const now = Date.now()

    // 1. Push the user's message to the collaborative ai-chat feed.
    appendChatMessage({
      id: `msg-${now}-user`,
      sender: senderName,
      role: "user",
      content: text,
      timestamp: now,
    })

    if (!textToSend) setInput("")
    setIsLoading(true)

    try {
      // 2. Trigger the design agent and read back the run handle + token.
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          roomId: projectId,
          projectId: projectId,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to trigger AI design agent")
      }

      const data = (await res.json()) as { runId?: string; publicToken?: string }
      if (!data.runId || !data.publicToken) {
        throw new Error("Design agent did not return a run handle.")
      }

      // 3. Store the run handle — useRealtimeRun takes over from here, and
      //    onComplete resets loading state when the run finishes.
      setRunId(data.runId)
      setPublicToken(data.publicToken)
    } catch (err) {
      // Surface errors as a message in the ai-chat feed.
      const message =
        err instanceof Error ? err.message : "Failed to start design agent."
      appendChatMessage({
        id: `msg-${Date.now()}-assistant`,
        sender: "Ghost AI",
        role: "assistant",
        content: `An error occurred while starting the design agent: ${message}`,
        timestamp: Date.now(),
      })
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getSpecDownloadUrl = (specId: string) =>
    `/api/projects/${projectId}/specs/${specId}/download`

  const handleSpecPreview = async (spec: ProjectSpecMetadata) => {
    setSelectedSpec(spec)
    setSpecContent("")
    setSpecPreviewError(null)
    setIsSpecPreviewLoading(true)

    try {
      const res = await fetch(getSpecDownloadUrl(spec.id))
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to load spec preview")
      }

      setSpecContent(await res.text())
    } catch (err) {
      setSpecPreviewError(
        err instanceof Error ? err.message : "Failed to load spec preview"
      )
    } finally {
      setIsSpecPreviewLoading(false)
    }
  }

  const handleSpecDownload = (
    spec: ProjectSpecMetadata,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    e?.stopPropagation()
    window.location.href = getSpecDownloadUrl(spec.id)
  }

  const closeSpecPreview = () => {
    setSelectedSpec(null)
    setSpecContent("")
    setSpecPreviewError(null)
  }

  const getCanvasSpecState = () =>
    new Promise<CanvasSpecState>((resolve) => {
      const requestId = `spec-${Date.now()}-${Math.random().toString(16).slice(2)}`
      const timeout = window.setTimeout(() => {
        window.removeEventListener("canvas-spec-state-response", handleResponse)
        resolve({ nodes: [], edges: [] })
      }, 300)

      const handleResponse = (event: Event) => {
        const detail = (event as CustomEvent<CanvasSpecState & { requestId?: string }>).detail
        if (detail?.requestId !== requestId) return

        window.clearTimeout(timeout)
        window.removeEventListener("canvas-spec-state-response", handleResponse)
        resolve({
          nodes: Array.isArray(detail.nodes) ? detail.nodes : [],
          edges: Array.isArray(detail.edges) ? detail.edges : [],
        })
      }

      window.addEventListener("canvas-spec-state-response", handleResponse)
      window.dispatchEvent(
        new CustomEvent("canvas-spec-state-request", { detail: { requestId } })
      )
    })

  const handleGenerateSpec = async () => {
    if (isSpecGenerating) return

    setIsSpecGenerating(true)
    setSpecGenerateError(null)

    try {
      const canvasState = await getCanvasSpecState()
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: projectId,
          chatHistory: messages,
          nodes: canvasState.nodes,
          edges: canvasState.edges,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to start spec generation (${res.status})`)
      }

      const data = (await res.json()) as { runId?: string; publicToken?: string }
      if (!data.runId || !data.publicToken) {
        throw new Error("Spec generation did not return a run handle.")
      }

      setSpecRunId(data.runId)
      setSpecPublicToken(data.publicToken)
    } catch (err) {
      setSpecGenerateError(
        err instanceof Error ? err.message : "Failed to start spec generation."
      )
      setIsSpecGenerating(false)
    }
  }

  const starterChips = [
    "Design an e-commerce backend",
    "Create a chat app architecture",
    "Build a CI/CD pipeline",
  ]

  return (
    <aside
      className={cn(
        "fixed right-0 top-12 z-40 flex h-[calc(100vh-3rem)] w-80 flex-col",
        "border-l border-surface-border bg-base/95 backdrop-blur-md shadow-2xl",
        "transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-primary-text leading-none">AI Workspace</span>
            <span className="text-xs text-muted-text mt-0.5">Collaborate with Ghost AI</span>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs System */}
      <Tabs defaultValue="architect" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-surface-border p-2 bg-surface/30">
          <TabsList className="w-full bg-subtle">
            <TabsTrigger
              value="architect"
              className="flex-1 bg-transparent text-muted-text data-active:bg-accent data-active:text-primary-text"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="flex-1 bg-transparent text-muted-text data-active:bg-accent data-active:text-primary-text"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Architect Tab */}
        <TabsContent value="architect" className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-subtle p-3 mb-3 text-brand">
                  <Bot className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-semibold text-primary-text">AI Architect</h3>
                <p className="text-xs text-muted-text mt-1 max-w-[200px]">
                  Ask questions to design architectures, define components, or generate specifications.
                </p>

                {/* Starter Chips */}
                <div className="mt-6 w-full flex flex-col gap-2">
                  {starterChips.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(chip)}
                      disabled={isBusy}
                      className="text-left w-full rounded-full bg-subtle hover:bg-subtle/80 border border-surface-border/50 px-3.5 py-2 text-xs font-medium text-accent-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat Area — rendered from the collaborative ai-chat feed */
              <div className="flex flex-col gap-3 pb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex w-full flex-col gap-0.5",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-[10px] text-muted-text font-medium">{msg.sender}</span>
                      <span className="text-[9px] text-muted-text/60">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-normal whitespace-pre-wrap shadow-sm",
                        msg.role === "user"
                          ? "bg-[#62C073] text-[#08210f] font-medium"
                          : "bg-elevated border border-surface-border text-copy-primary"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Compact status strip — only visible while a run is active */}
          {isBusy && (
            <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl border border-[#62C073]/30 bg-surface/90 px-3 py-2 backdrop-blur-md">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#62C073] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#62C073]" />
              </span>
              <span className="truncate text-[11px] font-medium text-[#62C073]">
                {latestStatusMessage?.text ||
                  latestStatusMessage?.message ||
                  aiStatus ||
                  (realtimeRun?.status === "QUEUED"
                    ? "Ghost AI is queued..."
                    : "Ghost AI is working...")}
              </span>
            </div>
          )}

          {/* Chat Input Box */}
          <div className="p-3 border-t border-surface-border bg-base/50 relative flex items-end gap-2">
            <div className="relative flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isBusy ? "Ghost AI is drawing..." : "Ask Ghost AI..."}
                disabled={isBusy}
                className="min-h-[72px] max-h-[160px] pr-10 py-2 resize-none overflow-y-auto w-full bg-subtle/50 border-surface-border disabled:opacity-50"
                style={{ height: "72px" }}
              />
              <Button
                size="icon-xs"
                className="absolute right-2.5 bottom-2.5 bg-[#62C073] hover:bg-[#62C073]/90 text-[#08210f] shadow-sm disabled:opacity-40"
                onClick={() => handleSend()}
                disabled={!input.trim() || isBusy}
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent value="specs" className="flex flex-1 flex-col overflow-hidden">
          {/* Sticky action header */}
          <div className="border-b border-surface-border bg-surface/30 p-3">
            <Button
              className="w-full gap-2 bg-accent font-medium text-white hover:bg-accent/80"
              onClick={handleGenerateSpec}
              disabled={isSpecGenerating}
            >
              {isSpecGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isSpecGenerating ? "Generating..." : "Generate Spec"}
            </Button>

            {specGenerateError && (
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-state-error/30 bg-state-error/10 px-3 py-2 text-xs text-state-error">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0">{specGenerateError}</span>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 p-4">
            {isSpecsLoading ? (
              /* Loading state */
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-text" />
                <p className="mt-3 text-xs text-muted-text">Loading specs…</p>
              </div>
            ) : specsError ? (
              /* Error state */
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 rounded-full bg-state-error/10 p-3 text-state-error">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-semibold text-primary-text">
                  Couldn&apos;t load specs
                </h3>
                <p className="mt-1 max-w-[220px] text-xs text-muted-text">{specsError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => loadSpecs()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </Button>
              </div>
            ) : specs.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 rounded-full bg-subtle p-3 text-brand">
                  <FileStack className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-semibold text-primary-text">No specs yet</h3>
                <p className="mt-1 max-w-[220px] text-xs text-muted-text">
                  Generate a spec from your current canvas and chat to see it listed here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-text">
                    Generated specs
                  </span>
                  <span className="text-[11px] text-muted-text">{specs.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {specs.map((spec) => (
                    <div
                      key={spec.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSpecPreview(spec)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleSpecPreview(spec)
                        }
                      }}
                      className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-surface-border bg-elevated px-3 py-2.5 text-left transition-colors hover:border-surface-border/80 hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dim text-brand">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-primary-text">
                          {spec.filename}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-muted-text">
                          {new Date(spec.createdAt).toLocaleString([], {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-muted-text opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={(e) => handleSpecDownload(spec, e)}
                        aria-label={`Download ${spec.filename}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedSpec)} onOpenChange={(open) => !open && closeSpecPreview()}>
        <DialogContent className="grid h-[80vh] max-h-[800px] w-[calc(100vw-3rem)] max-w-[90rem] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-3xl border border-surface-border bg-elevated p-0 sm:max-w-[85vw]">
          <DialogHeader className="border-b border-surface-border px-4 py-3 pr-12">
            <DialogTitle className="truncate text-sm text-primary-text">
              {selectedSpec?.filename ?? "Spec preview"}
            </DialogTitle>
            {selectedSpec && (
              <span className="text-xs text-muted-text">
                {new Date(selectedSpec.createdAt).toLocaleString()}
              </span>
            )}
          </DialogHeader>

          <ScrollArea className="min-h-0 px-4">
            <div className="py-4">
              {isSpecPreviewLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-text">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading preview...
                </div>
              ) : specPreviewError ? (
                <div className="flex items-start gap-2 rounded-xl border border-state-error/30 bg-state-error/10 px-3 py-2 text-sm text-state-error">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0">{specPreviewError}</span>
                </div>
              ) : (
                <MarkdownPreview content={specContent} />
              )}
            </div>
          </ScrollArea>

          {selectedSpec && (
            <div className="flex items-center justify-end gap-2 border-t border-surface-border px-4 py-3">
              <Button variant="outline" size="sm" onClick={closeSpecPreview}>
                Close
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-accent hover:bg-accent/80 text-white"
                onClick={() => handleSpecDownload(selectedSpec)}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </aside>
  )
}

function MarkdownPreview({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content)

  return (
    <div className="space-y-3 text-sm leading-6 text-copy-secondary">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const className = cn(
            "font-semibold text-primary-text",
            block.level === 1 && "text-xl",
            block.level === 2 && "text-lg",
            block.level >= 3 && "text-base"
          )

          if (block.level === 1) {
            return <h1 key={index} className={className}>{block.text}</h1>
          }
          if (block.level === 2) {
            return <h2 key={index} className={className}>{block.text}</h2>
          }
          if (block.level === 3) {
            return <h3 key={index} className={className}>{block.text}</h3>
          }
          if (block.level === 4) {
            return <h4 key={index} className={className}>{block.text}</h4>
          }
          if (block.level === 5) {
            return <h5 key={index} className={className}>{block.text}</h5>
          }
          return <h6 key={index} className={className}>{block.text}</h6>
        }

        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          )
        }

        if (block.type === "code") {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-xl border border-surface-border bg-base p-3 font-mono text-xs text-copy-secondary"
            >
              <code>{block.text}</code>
            </pre>
          )
        }

        return (
          <p key={index} className="whitespace-pre-wrap">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; text: string }

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split(/\r?\n/)
  const blocks: MarkdownBlock[] = []
  let paragraph: string[] = []
  let list: string[] = []
  let code: string[] | null = null

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join("\n") })
      paragraph = []
    }
  }

  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ type: "list", items: list })
      list = []
    }
  }

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (code) {
        blocks.push({ type: "code", text: code.join("\n") })
        code = null
      } else {
        flushParagraph()
        flushList()
        code = []
      }
      continue
    }

    if (code) {
      code.push(line)
      continue
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line)
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: heading[2],
      })
      continue
    }

    const listItem = /^\s*[-*]\s+(.+)$/.exec(line)
    if (listItem) {
      flushParagraph()
      list.push(listItem[1])
      continue
    }

    if (!line.trim()) {
      flushParagraph()
      flushList()
      continue
    }

    flushList()
    paragraph.push(line)
  }

  if (code) blocks.push({ type: "code", text: code.join("\n") })
  flushParagraph()
  flushList()

  return blocks
}
