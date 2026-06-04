import { supabase, Insight } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { 
  ArrowLeft, ExternalLink, Activity, Tag, 
  User, TrendingUp, Cpu, Calendar, AlertTriangle, 
  FileText
} from "lucide-react"
import Link from "next/link"
import { InsightChatToggle } from "@/components/InsightChatToggle"

export const revalidate = 60; // Revalidate every minute

export default async function InsightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  const insight = data as Insight;
  const score = insight.signal_score

  // Dynamic styling based on signal score
  let scoreColorClass = "text-zinc-400 border-zinc-800 bg-zinc-900/50"

  if (score >= 9) {
    scoreColorClass = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
  } else if (score >= 7) {
    scoreColorClass = "text-indigo-400 border-indigo-500/20 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
  }

  return (
    <main className="min-h-screen mesh-gradient-bg selection:bg-emerald-500/30 font-sans pb-24 relative">
      {/* Grid overlay for tech look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 z-10">
        
        <nav className="mb-10 flex items-center justify-between border-b border-zinc-900/80 pb-5">
          <Link 
            href="/" 
            className="group inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <InsightChatToggle insightId={insight.id} sourceName={insight.source_name} />
            <a
              href={insight.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-lg transition-all"
            >
              Original Source
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </nav>

        {/* Article/Signal Header */}
        <header className="mb-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border ${scoreColorClass}`}>
              <Activity className="h-3.5 w-3.5" />
              <span>Signal Score: {score}/10</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800/60 px-3 py-1 rounded-full">
              <Tag className="h-3.5 w-3.5 text-zinc-500" />
              <span>{insight.topic_tag}</span>
            </div>

            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider ml-auto">
              Processed {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {insight.source_name}
          </h1>
        </header>

        {/* 2-Column Split Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Left Column (Core Intel) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Core Thesis Section */}
            <section className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 md:p-8 backdrop-blur-md relative overflow-hidden shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/50 to-indigo-500/20" />
              
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2.5 text-zinc-100">
                <FileText className="h-4 w-4 text-emerald-400" />
                Core Thesis
              </h2>
              
              <ul className="space-y-6">
                {insight.core_thesis?.map((bullet, idx) => (
                  <li key={idx} className="text-zinc-300 text-sm leading-relaxed flex gap-4 items-start group">
                    <span className="flex-shrink-0 flex items-center justify-center font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-sm w-6 h-6 mt-0.5">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="pt-0.5">{bullet}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Contrarian View / Risks Section */}
            <section className="rounded-xl border border-zinc-900 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent p-6 md:p-8 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500/30" />
              
              <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-4.5 w-4.5" />
                Contrarian View & Risks
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed pl-1">
                {insight.contrarian_view || "No major counter-trends or risks identified for this signal."}
              </p>
            </section>

          </div>

          {/* Right Column (Structured Metadata & Impact Analysis) */}
          <div className="space-y-6">
            
            <h3 className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase border-b border-zinc-900 pb-2">
              Analysis Context
            </h3>

            {/* Author Context */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 backdrop-blur-md hover:border-zinc-800 transition-colors">
              <h4 className="text-xs font-bold mb-2.5 flex items-center gap-2 text-zinc-200">
                <User className="h-4 w-4 text-blue-400" />
                Author Context
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {insight.author_context || "No context information on the publisher is logged for this signal."}
              </p>
            </div>

             {/* Market Impact */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 backdrop-blur-md hover:border-zinc-800 transition-colors">
              <h4 className="text-xs font-bold mb-2.5 flex items-center gap-2 text-zinc-200">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Market Impact
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {insight.market_impact || "No direct stock or industry financial impacts logged."}
              </p>
            </div>

            {/* Tech Impact */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 backdrop-blur-md hover:border-zinc-800 transition-colors">
              <h4 className="text-xs font-bold mb-2.5 flex items-center gap-2 text-zinc-200">
                <Cpu className="h-4 w-4 text-purple-400" />
                Tech Impact
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {insight.tech_impact || "No detailed microarchitectural or cloud hardware impacts specified."}
              </p>
            </div>

            {/* Catalysts to Watch */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 backdrop-blur-md hover:border-zinc-800 transition-colors">
              <h4 className="text-xs font-bold mb-2.5 flex items-center gap-2 text-zinc-200">
                <Calendar className="h-4 w-4 text-orange-400" />
                Catalysts to Watch
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {insight.catalysts || "No clear calendar dates or announcement triggers mentioned."}
              </p>
            </div>

          </div>

        </div>
      </div>
    </main>
  )
}
