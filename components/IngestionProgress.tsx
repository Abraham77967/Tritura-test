"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Database, CheckCircle2 } from "lucide-react"

export function IngestionProgress() {
  const [status, setStatus] = useState("Idle")
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase.from("system_status").select("*").eq("id", 1).single()
      if (data) {
        setStatus(data.current_status)
        if (data.last_fetched_at) {
          setLastFetched(new Date(data.last_fetched_at))
        }
      }
    }
    
    fetchStatus()
    // Poll every 3 seconds for live updates
    const interval = setInterval(fetchStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  const isRunning = status !== "Idle"

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-lg shadow-black/20 overflow-hidden relative group transition-all duration-300 hover:border-zinc-700 w-fit mt-4 lg:mt-0">
      {/* Background glow when running */}
      {isRunning && (
        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
      )}
      
      <div className="flex items-center gap-2.5 relative z-10">
        <div className="relative flex h-2 w-2">
          {isRunning ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600"></span>
          )}
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${isRunning ? "text-emerald-400" : "text-zinc-400"}`}>
          {isRunning ? "Ingestion Active" : "Ingestion Idle"}
        </span>
      </div>

      <div className="hidden sm:block w-px h-3.5 bg-zinc-800 relative z-10" />
      
      <div className="flex items-center gap-2 relative z-10 text-xs">
        {isRunning ? (
          <>
            <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            <span className="text-zinc-300 font-medium max-w-[200px] sm:max-w-[300px] truncate" title={status}>
              {status}
            </span>
          </>
        ) : (
          <>
            <Database className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500 font-medium">
              {lastFetched 
                ? `Last update: ${formatDistanceToNow(lastFetched, { addSuffix: true })}` 
                : "No data fetched yet"}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
