"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { InsightChat } from "./InsightChat"

interface InsightChatToggleProps {
  insightId: string;
  sourceName: string;
}

export function InsightChatToggle({ insightId, sourceName }: InsightChatToggleProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 rounded-lg transition-all cursor-pointer hover:bg-indigo-500/10 shadow-sm"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Chat with Transcript
      </button>

      <InsightChat
        insightId={insightId}
        sourceName={sourceName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
