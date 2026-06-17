import { Cpu, Share2, FileText } from "lucide-react"

const features = [
  {
    icon: Cpu,
    title: "AI Architecture Generation",
    desc: "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    desc: "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    desc: "Export a complete Markdown technical spec directly from the canvas graph.",
  },
]

export function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex w-1/2 flex-col px-16 xl:px-20 py-12 bg-bg-subtle border-r border-border-default">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-accent-primary-dim border border-accent-primary/20 flex items-center justify-center">
          <span className="text-sm font-bold text-accent-primary">G</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-text-primary">Ghost AI</span>
      </div>

      <div className="mt-auto mb-auto flex flex-col justify-center py-16">
        <h1 className="text-4xl font-bold text-text-primary leading-tight mb-5">
          Design systems at the<br />speed of thought.
        </h1>
        <p className="text-text-secondary text-base mb-10 max-w-sm leading-relaxed">
          Describe your architecture in plain English. Ghost AI maps it to a
          shared canvas your whole team can refine in real time.
        </p>

        <div className="space-y-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-bg-elevated border border-border-default flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-accent-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{title}</p>
                <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
