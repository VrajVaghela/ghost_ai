"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Sparkles, FileText, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AISidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function AISidebar({ isOpen, onClose }: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim()
    if (!text) return

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])
    if (!textToSend) setInput("")

    // Simulated response for interactive magic
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: `I received your architecture query: "${text}". I am analyzing the design patterns and edge behaviors. Let me know if you would like me to compile this into a Spec file.`,
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 800)
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
                      className="text-left w-full rounded-full bg-subtle hover:bg-subtle/80 border border-surface-border/50 px-3.5 py-2 text-xs font-medium text-accent-text transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat Area */
              <div className="flex flex-col gap-3 pb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex w-full",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-normal whitespace-pre-wrap shadow-sm",
                        msg.role === "user"
                          ? "bg-brand-dim border-brand/50 border-2 text-copy-primary"
                          : "bg-elevated border border-surface-border text-accent-text"
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

          {/* Chat Input Box */}
          <div className="p-3 border-t border-surface-border bg-base/50 relative flex items-end gap-2">
            <div className="relative flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI..."
                className="min-h-[72px] max-h-[160px] pr-10 py-2 resize-none overflow-y-auto w-full bg-subtle/50 border-surface-border"
                style={{ height: "72px" }}
              />
              <Button
                size="icon-xs"
                className="absolute right-2.5 bottom-2.5 bg-accent hover:bg-accent/80 text-white shadow-sm"
                onClick={() => handleSend()}
                disabled={!input.trim()}
              >
                <Send className="h-3.5 w-3.5" />
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
