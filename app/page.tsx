"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { InsightCard } from "@/components/InsightCard"
import { TimeFilter, TimeRange } from "@/components/TimeFilter"
import { IngestionProgress } from "@/components/IngestionProgress"
import { supabase, Insight } from "@/lib/supabase"
import { subWeeks, subMonths } from "date-fns"
import { 
  DollarSign, Cpu, Briefcase, 
  Search, SlidersHorizontal, Layers, ShieldAlert,
  Database, Sparkles, Activity
} from "lucide-react"

type Category = "Financial Side" | "Technical Stuffs" | "Business Strategy" | "All";

export default function Home() {
  const [timeRange, setTimeRange] = useState<TimeRange>("1w")
  const [activeCategory, setActiveCategory] = useState<Category>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchInsights() {
      setIsLoading(true)
      
      let fromDate = new Date()
      let minScore = 0
      
      switch (timeRange) {
        case "1w":
          fromDate = subWeeks(new Date(), 1)
          minScore = 0
          break
        case "1m":
          fromDate = subMonths(new Date(), 1)
          minScore = 7
          break
        case "3m":
          fromDate = subMonths(new Date(), 3)
          minScore = 8
          break
        case "6m":
          fromDate = subMonths(new Date(), 6)
          minScore = 9
          break
      }

      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .gte('created_at', fromDate.toISOString())
        .gte('signal_score', minScore)
        .order('signal_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error fetching insights:", error)
      } else {
        setInsights(data as Insight[] || [])
      }
      
      setIsLoading(false)
    }

    fetchInsights()
  }, [timeRange])

  // Filter insights based on Category and Search Query
  const filteredInsights = useMemo(() => {
    let result = insights
    if (activeCategory !== "All") {
      result = result.filter(i => i.topic_tag === activeCategory)
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      result = result.filter(i => 
        i.source_name.toLowerCase().includes(q) || 
        i.topic_tag.toLowerCase().includes(q) || 
        (i.core_thesis && i.core_thesis.some(thesis => thesis.toLowerCase().includes(q))) ||
        (i.author_context && i.author_context.toLowerCase().includes(q))
      )
    }
    return result
  }, [insights, activeCategory, searchQuery])

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = insights.length
    const maxScore = insights.reduce((max, item) => item.signal_score > max ? item.signal_score : max, 0)
    const avgScore = total > 0 ? (insights.reduce((sum, item) => sum + item.signal_score, 0) / total).toFixed(1) : "0.0"
    
    return {
      total,
      maxScore,
      avgScore
    }
  }, [insights])

  const categories = [
    { name: "All", icon: Layers, color: "text-emerald-400" },
    { name: "Financial Side", icon: DollarSign, color: "text-emerald-400" },
    { name: "Technical Stuffs", icon: Cpu, color: "text-blue-400" },
    { name: "Business Strategy", icon: Briefcase, color: "text-purple-400" },
  ]

  return (
    <main className="min-h-screen mesh-gradient-bg selection:bg-emerald-500/30 font-sans pb-24 relative">
      {/* Grid overlay for tech look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8 z-10">
        
        {/* Top Header Section (Combined & Compact) */}
        <header className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-zinc-900 pb-6">
          <div className="flex flex-col gap-1.5 max-w-2xl">
            {/* Title / Name & Active indicator */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent">
                Tritura
              </h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase">Strict Gatekeeper Active</span>
              </div>
              <Link
                href="/research"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-[9px] font-bold text-indigo-400 tracking-wider uppercase cursor-pointer"
              >
                <Cpu className="w-3 h-3 text-indigo-400" />
                Research Agent
              </Link>
            </div>
            {/* Latin definition and site purpose */}
            <p className="text-xs text-zinc-400 leading-relaxed">
              <span className="italic font-semibold text-zinc-200">trītūra</span> (Latin) • The act of separating grain from chaff. Filtering out the noise to deliver high-signal AI, compute hardware, and tech financials intelligence.
            </p>
            <IngestionProgress />
          </div>

          {/* Compact Stats Capsule */}
          <div className="flex items-center gap-3 bg-zinc-950/40 border border-zinc-900 px-4 py-2.5 rounded-full backdrop-blur-md w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[9px] text-zinc-400 font-bold tracking-wider uppercase">Total Signals</span>
              <span className="text-xs font-extrabold text-white">{stats.total}</span>
            </div>
            <div className="h-4.5 w-px bg-zinc-900 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500/80" />
              <span className="text-[9px] text-zinc-400 font-bold tracking-wider uppercase">Max Score</span>
              <span className="text-xs font-extrabold text-white">{stats.maxScore}</span>
            </div>
            <div className="h-4.5 w-px bg-zinc-900 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[9px] text-zinc-400 font-bold tracking-wider uppercase">Average Score</span>
              <span className="text-xs font-extrabold text-white">{stats.avgScore}</span>
            </div>
          </div>
        </header>

        {/* Search, Filter, and Category Controller Panel */}
        <section className="rounded-2xl bg-zinc-950/65 border border-zinc-900 p-5 md:p-6 mb-8 backdrop-blur-xl flex flex-col gap-5 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by source, tag, or core thesis keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Time Filter Component */}
            <div className="flex-shrink-0">
              <TimeFilter value={timeRange} onChange={setTimeRange} />
            </div>
          </div>

          <div className="h-px bg-zinc-900/80" />

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 mr-2 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter Tag:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.name
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name as Category)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm" 
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? cat.color : "text-zinc-500"}`} />
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Content Area */}
        {isLoading ? (
          /* Skeleton Grid Loader */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 4, 6].map((i) => (
              <div key={i} className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 flex flex-col gap-4 animate-pulse h-[240px]">
                <div className="flex items-center justify-between">
                  <div className="w-24 h-4 bg-zinc-800 rounded-sm" />
                  <div className="w-16 h-5 bg-zinc-800 rounded-full" />
                </div>
                <div className="w-full h-6 bg-zinc-800 rounded-sm mt-2" />
                <div className="w-3/4 h-6 bg-zinc-800 rounded-sm" />
                <div className="space-y-2 mt-auto">
                  <div className="w-full h-3 bg-zinc-900 rounded-sm" />
                  <div className="w-5/6 h-3 bg-zinc-900 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredInsights.length > 0 ? (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredInsights.map((insight) => (
              <div 
                key={insight.id} 
                className="opacity-0 translate-y-4 animate-[fadeIn_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ animationDelay: `${insights.indexOf(insight) * 20}ms` }}
              >
                <InsightCard insight={insight} />
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 rounded-2xl border border-zinc-900 bg-zinc-950/20 backdrop-blur-md flex flex-col items-center justify-center p-6">
            <ShieldAlert className="w-10 h-10 text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-zinc-300">No signals matched filter criteria</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              Try adjusting your search query, selecting &quot;All&quot; categories, or changing the signal score threshold.
            </p>
          </div>
        )}
      </div>

      {/* Embedded CSS animations for entry fade-in */}
      <style jsx global>{`
        @keyframes fadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  )
}
