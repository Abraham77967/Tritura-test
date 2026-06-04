"use client"

import { cn } from "@/lib/utils"

export type TimeRange = "1w" | "1m" | "3m" | "6m"

interface TimeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

const timeFilters: { label: string; value: TimeRange }[] = [
  { label: "This Week", value: "1w" },
  { label: "1 Month", value: "1m" },
  { label: "3 Months", value: "3m" },
  { label: "6 Months", value: "6m" },
]

export function TimeFilter({ value, onChange }: TimeFilterProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl max-w-full overflow-x-auto no-scrollbar">
      {timeFilters.map((filter) => {
        const isActive = value === filter.value
        return (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={cn(
              "relative flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-300 outline-hidden min-w-[90px] cursor-pointer",
              isActive
                ? "bg-zinc-900 border border-zinc-800 text-emerald-400 shadow-md shadow-black/40"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border border-transparent"
            )}
          >
            <span className="text-xs font-semibold tracking-wide">
              {filter.label}
            </span>
            
            {isActive && (
              <span className="absolute top-1.5 right-1.5 h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            )}
          </button>
        )
      })}
    </div>
  )
}
