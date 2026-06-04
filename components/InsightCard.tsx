import { Insight } from "@/lib/supabase"
import { Tag, PlayCircle, Newspaper, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const SourceIcon = insight.content_type === "video" ? PlayCircle : Newspaper
  const score = insight.signal_score
  
  // Dynamic styling based on signal score
  let scoreColorClass = "text-zinc-400 border-zinc-800 bg-zinc-900/50"
  let leftGlowClass = "bg-zinc-800"

  if (score >= 9) {
    scoreColorClass = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
    leftGlowClass = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
  } else if (score >= 7) {
    scoreColorClass = "text-indigo-400 border-indigo-500/20 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
    leftGlowClass = "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
  }

  // Use first thesis point as the headline if available, otherwise source_name
  const headline = insight.core_thesis?.[0] || insight.source_name
  const supportingThesis = insight.core_thesis?.slice(1, 3) || []

  return (
    <Link 
      href={`/insight/${insight.id}`} 
      className="group relative rounded-xl glow-card p-6 flex flex-col gap-4 h-full overflow-hidden"
    >
      {/* Vertical Score Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 group-hover:w-[4px] ${leftGlowClass}`} />

      {/* Card Header */}
      <div className="flex items-start justify-between gap-4 pl-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <SourceIcon className={`h-4 w-4 ${insight.content_type === "video" ? "text-red-400" : "text-blue-400"}`} />
            <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase line-clamp-1">
              {insight.source_name}
            </span>
          </div>
        </div>

        {/* Signal Score Badge */}
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${scoreColorClass}`}>
          <span>Signal Score: {score}/10</span>
        </div>
      </div>

      {/* Core Headline */}
      <div className="pl-1">
        <h3 className="text-base font-bold text-zinc-100 group-hover:text-white leading-snug transition-colors line-clamp-2">
          {headline}
        </h3>
      </div>

      {/* Supporting Thesis Bullet Points */}
      {supportingThesis.length > 0 && (
        <div className="flex-grow pl-1">
          <ul className="space-y-2.5">
            {supportingThesis.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-400 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-700 group-hover:bg-emerald-500/50 flex-shrink-0 transition-colors" />
                <span className="line-clamp-2">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-auto pt-4 pl-1 flex items-center justify-between border-t border-zinc-900/80">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-500 font-medium">
            {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded-md">
            <Tag className="h-2.5 w-2.5 text-zinc-500" />
            <span className="font-medium">{insight.topic_tag}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
          <span>Read Details</span>
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
