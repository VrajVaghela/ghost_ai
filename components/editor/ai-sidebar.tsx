"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Sparkles, FileText, Download, Loader2 } from "lucide-react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStorage, useOthers, useMutation, useSelf } from "@liveblocks/react"
import { LiveList, LiveObject } from "@liveblocks/client"
import type { designAgentTask } from "@/trigger/design-agent"
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

export function AISidebar({ isOpen, onClose, projectId }: AISidebarProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState<string | null>(null)
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
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-4">
              <Button className="w-full bg-accent hover:bg-accent/80 text-white gap-2 font-medium">
                <Sparkles className="h-4 w-4" />
                Generate Spec
              </Button>

              {/* Demo Spec Card */}
              <div className="flex flex-col gap-3 rounded-2xl p-4 bg-elevated border border-surface-border">
                <div className="flex items-start gap-2.5">
                  <div className="rounded-lg bg-subtle p-2 text-brand">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary-text">E-commerce API Spec</span>
                    <span className="text-xs text-muted-text mt-0.5">Updated 2 hours ago</span>
                  </div>
                </div>

                <div className="rounded-lg bg-base/50 p-2.5 font-mono text-[10px] text-copy-secondary overflow-hidden text-ellipsis leading-relaxed border border-surface-border/50">
                  <pre className="whitespace-pre-wrap">
                    {`openapi: 3.0.0
info:
  title: E-commerce Backend API
  version: 1.0.0
paths:
  /products:
    get:
      summary: List products`}
                  </pre>
                </div>

                <div className="flex items-center justify-between border-t border-surface-border/50 pt-2.5 mt-1">
                  <span className="text-[10px] text-muted-text">PDF & OpenAPI formats</span>
                  <Button variant="ghost" size="xs" className="gap-1 text-xs text-muted-text cursor-not-allowed" disabled>
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
