"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, Cpu, Send, Loader2, CheckCircle2, 
  Terminal, AlertCircle, FileText 
} from "lucide-react"

interface ResearchStep {
  text: string;
  status: "pending" | "running" | "done" | "error";
}

interface ParsedLine {
  type: "h1" | "h2" | "h3" | "list" | "numlist" | "table" | "p" | "space";
  content?: string;
  cells?: string[];
  index?: string;
}

function parseMarkdownLines(text: string): ParsedLine[] {
  const lines = text.split('\n')
  const parsed: ParsedLine[] = []
  let inTable = false

  for (const line of lines) {
    if (line.startsWith('### ')) {
      inTable = false
      parsed.push({ type: "h3", content: line.slice(4) })
    } else if (line.startsWith('## ')) {
      inTable = false
      parsed.push({ type: "h2", content: line.slice(3) })
    } else if (line.startsWith('# ')) {
      inTable = false
      parsed.push({ type: "h1", content: line.slice(2) })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      inTable = false
      parsed.push({ type: "list", content: line.slice(2) })
    } else if (line.trim().startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c !== "")
      const isDivider = line.includes('---') || line.includes('===')
      
      if (isDivider) {
        inTable = true
        continue
      }
      parsed.push({ type: "table", cells, index: inTable ? "body" : "header" })
    } else if (line.trim() === '') {
      inTable = false
      parsed.push({ type: "space" })
    } else {
      const numListMatch = line.match(/^(\d+)\.\s(.*)/)
      if (numListMatch) {
        inTable = false
        parsed.push({ type: "numlist", index: numListMatch[1], content: numListMatch[2] })
      } else {
        inTable = false
        parsed.push({ type: "p", content: line })
      }
    }
  }
  return parsed
}

// Simple custom markdown renderer
function MarkdownRenderer({ text }: { text: string }) {
  const parsedLines = parseMarkdownLines(text)
  
  return (
    <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
      {parsedLines.map((line, idx) => {
        switch (line.type) {
          case "h3":
            return <h4 key={idx} className="text-sm font-bold text-emerald-400 mt-5 mb-2 uppercase tracking-wider">{line.content}</h4>
          case "h2":
            return <h3 key={idx} className="text-base font-bold text-zinc-100 mt-7 mb-3 border-b border-zinc-900 pb-2">{line.content}</h3>
          case "h1":
            return <h2 key={idx} className="text-xl font-extrabold text-white mt-8 mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">{line.content}</h2>
          case "list":
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>{line.content}</span>
              </div>
            )
          case "numlist":
            return (
              <div key={idx} className="flex items-start gap-3 pl-2">
                <span className="font-mono text-xs font-semibold text-indigo-400 mt-0.5">{line.index?.padStart(2, '0')}</span>
                <span>{line.content}</span>
              </div>
            )
          case "table":
            const isHeader = line.index === "header"
            return (
              <div key={idx} className={`grid grid-cols-3 gap-4 py-2.5 px-4 border-b border-zinc-900/60 text-xs ${
                isHeader ? "bg-zinc-950 font-semibold text-zinc-200 border-t border-zinc-900" : "bg-zinc-950/20 text-zinc-400"
              }`}>
                {line.cells?.map((cell, cIdx) => (
                  <span key={cIdx}>{cell}</span>
                ))}
              </div>
            )
          case "space":
            return <div key={idx} className="h-1.5" />
          default:
            return <p key={idx} className="pl-1 text-zinc-400">{line.content}</p>
        }
      })}
    </div>
  )
}

export default function ResearchPage() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [steps, setSteps] = useState<ResearchStep[]>([])
  const [report, setReport] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const exampleQueries = [
    "Analyze NVIDIA GPU sales trends and data center liquid cooling system companies.",
    "What are the key technical breakthroughs in Blackwell cooling and server architecture?",
    "Compare TSMC semiconductor capacity expansions against hyperscaler compute demands."
  ]

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setReport("")
    setErrorMsg("")
    setSteps([
      { text: "Initializing autonomous research plan...", status: "running" }
    ])

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() })
      })

      if (!response.ok) {
        throw new Error("Research compilation failed. Make sure database migrations are run.")
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      // Convert backend steps list into status timeline objects
      const parsedSteps: ResearchStep[] = data.steps.map((stepText: string, idx: number) => ({
        text: stepText,
        status: idx === data.steps.length - 1 ? "done" : "done"
      }))

      setSteps(parsedSteps)
      setReport(data.report)

    } catch (err: unknown) {
      const error = err as Error
      console.error(error)
      setErrorMsg(error?.message || "Internal server error conducting research")
      setSteps(prev => {
        const copy = [...prev]
        if (copy.length > 0) {
          copy[copy.length - 1].status = "error"
        }
        return copy
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen mesh-gradient-bg selection:bg-emerald-500/30 font-sans pb-24 relative">
      {/* Grid overlay for tech look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 z-10">
        
        {/* Navigation Bar */}
        <nav className="mb-10 flex items-center justify-between border-b border-zinc-900/80 pb-5">
          <Link 
            href="/" 
            className="group inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="text-[9px] font-bold text-indigo-400 tracking-wider uppercase">Agent Workspace Online</span>
          </div>
        </nav>

        {/* Title */}
        <header className="mb-10 max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3">
            Autonomous Research Assistant
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
            Prompt the agent to compile a comprehensive research dossier. The agent drafts a plan, searches the local vector database archive, queries live Google Search, and synthesizes a grounded technical briefing.
          </p>
        </header>

        {/* Console Box */}
        <section className="rounded-xl border border-zinc-900 bg-zinc-950/45 p-6 backdrop-blur-md shadow-2xl mb-8">
          <form onSubmit={handleResearch} className="flex gap-3">
            <input
              type="text"
              placeholder="E.g., Analyze hyperscaler GPU capacity expansions and liquid cooling company earnings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              className="flex-grow bg-zinc-900/70 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-700 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 border border-indigo-500 text-xs font-semibold text-white hover:bg-indigo-500 transition-all cursor-pointer disabled:opacity-50 disabled:hover:bg-indigo-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Research
                </>
              )}
            </button>
          </form>

          {/* Quick Query Pills */}
          {!isLoading && !report && (
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Example Briefing Prompts:</span>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuery(q)}
                    className="text-left text-[11px] text-zinc-400 bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 hover:text-zinc-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer max-w-full truncate"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Steps Timeline & Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Agent Activity Log */}
          {(isLoading || steps.length > 0) && (
            <div className="lg:col-span-1 rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 backdrop-blur-md relative">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500/30" />
              
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Agent Execution steps
              </h3>

              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-zinc-900">
                {steps.map((step, idx) => {
                  const isLast = idx === steps.length - 1
                  const isRunning = isLast && isLoading
                  const isError = step.status === "error"

                  return (
                    <div key={idx} className="flex gap-4 items-start relative z-10">
                      <div className={`flex-shrink-0 w-6.5 h-6.5 rounded-full flex items-center justify-center border text-[10px] ${
                        isRunning 
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                          : isError 
                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}>
                        {isRunning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isError ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-xs font-medium leading-relaxed ${
                          isRunning ? "text-indigo-400 animate-pulse" : isError ? "text-red-400" : "text-zinc-300"
                        }`}>
                          {step.text}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {isLoading && steps.length > 0 && steps[steps.length - 1].status !== "running" && (
                  <div className="flex gap-4 items-start relative z-10">
                    <div className="flex-shrink-0 w-6.5 h-6.5 rounded-full flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-xs font-medium text-indigo-400 animate-pulse leading-relaxed">
                        Formulating next logical subtask...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dossier Report output */}
          <div className="lg:col-span-2 space-y-6">
            {errorMsg && (
              <div className="rounded-xl border border-red-950 bg-red-950/15 p-5 text-xs text-red-400 flex items-start gap-3">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Research Execution Error</h4>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            {report ? (
              <section className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-6 md:p-8 backdrop-blur-md relative shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/50 to-emerald-500/20" />
                
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Synthesized Research Dossier
                </h3>

                <MarkdownRenderer text={report} />
              </section>
            ) : isLoading ? (
              /* Skeletal loader for report */
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/10 p-6 md:p-8 animate-pulse space-y-6">
                <div className="w-1/3 h-5 bg-zinc-900 rounded-sm" />
                <div className="space-y-3">
                  <div className="w-full h-4 bg-zinc-900 rounded-sm" />
                  <div className="w-full h-4 bg-zinc-900 rounded-sm" />
                  <div className="w-5/6 h-4 bg-zinc-900 rounded-sm" />
                </div>
                <div className="h-20 bg-zinc-900/40 rounded-xl" />
                <div className="space-y-3">
                  <div className="w-full h-4 bg-zinc-900 rounded-sm" />
                  <div className="w-2/3 h-4 bg-zinc-900 rounded-sm" />
                </div>
              </div>
            ) : (
              /* Static placeholder when workspace is idle */
              !errorMsg && (
                <div className="rounded-xl border border-zinc-900 bg-zinc-950/10 p-12 text-center flex flex-col items-center justify-center">
                  <Terminal className="w-10 h-10 text-zinc-800 mb-3" />
                  <h4 className="text-zinc-400 font-bold text-sm">Workspace Idle</h4>
                  <p className="text-xs text-zinc-600 max-w-sm mt-1">
                    Submit a query above to command the autonomous research agent. It will compile live web sources and your database transcripts dynamically.
                  </p>
                </div>
              )
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
