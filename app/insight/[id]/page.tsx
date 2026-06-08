import { supabase, Insight } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { 
  ArrowLeft, ExternalLink, Activity, Tag, 
  User, TrendingUp, Cpu, Calendar, AlertTriangle, 
  FileText, ArrowRight, ShieldAlert, Zap
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

  // Dynamic styling based on signal score using existing Tritura theme (Emerald/Indigo)
  let scoreColorClass = "text-zinc-400 border-zinc-800 bg-zinc-900/50"

  if (score >= 9) {
    scoreColorClass = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
  } else if (score >= 7) {
    scoreColorClass = "text-indigo-400 border-indigo-500/30 bg-indigo-500/10"
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-300 font-sans pb-24 relative overflow-hidden">
      {/* Grid overlay for tech look matching the mockup */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative mx-auto px-6 py-8 sm:px-12 lg:px-16 xl:px-24 max-w-[1600px] z-10">
        
        {/* Top Navigation Bar */}
        <nav className="mb-20 flex flex-wrap items-center justify-between border-b border-zinc-800/80 pb-6 gap-6">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Dashboard
            </Link>
            <div className="hidden sm:block text-2xl font-black tracking-tight text-white">
              Tritura<span className="text-emerald-500">.</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <Link href="/research" className="hover:text-zinc-200 transition-colors">Research Hub</Link>
              <span className="hover:text-zinc-200 transition-colors cursor-pointer">Model Directory</span>
            </div>
            
            <a
              href={insight.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-emerald-400 hover:bg-emerald-300 text-zinc-950 px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm"
            >
              Original Source
            </a>
            
            <div className="border-l border-zinc-800 pl-6">
              <InsightChatToggle insightId={insight.id} sourceName={insight.source_name} />
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="mb-20">
          <div className="flex items-center gap-3 text-emerald-400 font-bold text-[10px] tracking-widest uppercase mb-6">
            <span className="w-8 h-px bg-emerald-400"></span>
            CORE THESIS
          </div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-white leading-[1.05] max-w-5xl">
              {insight.source_name}
            </h1>
            
            <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 lg:pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border ${scoreColorClass}`}>
                  SIGNAL SCORE: {score}/10
                </div>
                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-zinc-800 text-zinc-400 bg-zinc-900/30 rounded-sm">
                  {insight.topic_tag}
                </div>
              </div>
              <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest mt-1">
                PROCESSED {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        </header>

        {/* Core Thesis 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 mb-20 border-b border-zinc-800/60 pb-20">
          {insight.core_thesis?.map((bullet, idx) => {
            // Attempt to extract a bold title if the bullet follows a "Title: Content" pattern
            const parts = bullet.split(':');
            const hasTitle = parts.length > 1 && parts[0].length < 60;
            const title = hasTitle ? parts[0].trim() : `Key Insight ${idx + 1}`;
            const desc = hasTitle ? parts.slice(1).join(':').trim() : bullet;

            return (
              <div key={idx} className="relative group">
                <div className="text-[120px] font-black leading-none text-emerald-500/[0.04] absolute -top-12 -left-6 -z-10 select-none group-hover:text-emerald-500/[0.08] transition-colors">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-3 flex items-center gap-2">
                  <span className="text-emerald-500">{`0${idx + 1}`}</span>
                  {title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            )
          })}
        </div>

        {/* Bottom Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column - Contrarian View */}
          <div className="lg:col-span-8">
            <div className="border border-zinc-800/80 bg-zinc-900/20 p-8 md:p-12 h-full relative group hover:border-amber-500/30 transition-all rounded-sm flex flex-col">
              <div className="flex items-center gap-2 mb-8">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  CONTRARIAN VIEW & RISKS
                </span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">
                Critical Risk Assessment & Counter-Trends
              </h2>
              
              <p className="text-zinc-400 leading-relaxed text-sm max-w-3xl mb-12">
                {insight.contrarian_view || "Our automated analysis did not identify any major counter-trends, bear cases, or significant risks associated with this specific signal."}
              </p>
              
              <div className="mt-auto pt-8 border-t border-zinc-800/50">
                <button className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 hover:text-amber-400 transition-colors">
                  READ FULL RISK ASSESSMENT <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Metadata Grid */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Author Context Box */}
            <div className="border border-zinc-800/60 bg-zinc-900/30 p-6 rounded-sm hover:border-zinc-700 transition-colors">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-4">AUTHOR CONTEXT</span>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-700/50">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {insight.author_context || "No detailed publisher or author context was identified by the parsing engine."}
                </p>
              </div>
            </div>

            {/* Market Impact Box */}
            <div className="border border-zinc-800/60 bg-zinc-900/30 p-6 rounded-sm hover:border-zinc-700 transition-colors relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">MARKET IMPACT</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed relative z-10">
                {insight.market_impact || "No direct stock impacts, ticker movements, or industry valuations noted."}
              </p>
              <div className="absolute -bottom-6 -right-6 text-emerald-500/5 pointer-events-none">
                <TrendingUp className="w-32 h-32" />
              </div>
            </div>

            {/* Tech Impact Box */}
            <div className="border border-zinc-800/60 bg-zinc-900/30 p-6 rounded-sm hover:border-zinc-700 transition-colors relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">TECH IMPACT</span>
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed relative z-10">
                {insight.tech_impact || "No detailed architectural or infrastructure impacts specified."}
              </p>
              <div className="absolute -bottom-6 -right-6 text-indigo-500/5 pointer-events-none">
                <Cpu className="w-32 h-32" />
              </div>
            </div>

            {/* Catalysts Box */}
            <div className="border border-zinc-800/60 bg-zinc-900/30 p-6 rounded-sm hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">CATALYSTS TO WATCH</span>
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <ul className="space-y-3">
                {insight.catalysts ? (
                  // Simple split by period or bullet if available, otherwise just render
                  insight.catalysts.split(/(?:•|-|\. )/).filter(c => c.trim().length > 5).map((cat, i) => (
                    <li key={i} className="flex gap-2 text-xs text-zinc-300">
                      <span className="text-orange-500">•</span>
                      <span>{cat.trim()}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">No clear catalysts or upcoming dates identified.</p>
                )}
              </ul>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 border-t border-zinc-800/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-zinc-500">
            <span className="font-bold text-zinc-400">Tritura</span> © {new Date().getFullYear()}. For professional research purposes only.
          </div>
          <div className="flex gap-6 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
            <a href={insight.url} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">Original Sources</a>
            <span className="hover:text-zinc-300 transition-colors cursor-pointer">Chat with AI</span>
            <span className="hover:text-zinc-300 transition-colors cursor-pointer">Privacy Protocol</span>
          </div>
        </footer>

      </div>
    </main>
  )
}

