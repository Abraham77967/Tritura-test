"use client"

import { useState, useRef, useEffect } from "react"
import { Send, X, Bot, User, Loader2, Sparkles } from "lucide-react"

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InsightChatProps {
  insightId: string;
  isOpen: boolean;
  onClose: () => void;
  sourceName: string;
}

export function InsightChat({ insightId, isOpen, onClose, sourceName }: InsightChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I have indexed the context for "${sourceName}". Ask me anything about the underlying transcript or article details.`
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch("/api/insight/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          insightId,
          message: userMessage
        })
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
    } catch (error) {
      console.error(error)
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error searching this transcript. Please verify the database migrations have been applied." }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        {/* Chat Panel */}
        <div className="w-screen max-w-md transform bg-zinc-950 border-l border-zinc-900 flex flex-col shadow-2xl relative">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">Insight RAG Assistant</h3>
                <p className="text-[10px] text-zinc-500 font-semibold truncate max-w-[220px] mt-0.5">{sourceName}</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 no-scrollbar">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant"
              return (
                <div 
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center border text-[10px] ${
                    isAssistant 
                      ? "bg-zinc-900 border-zinc-800 text-zinc-400" 
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}>
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  
                  <div className={`rounded-xl p-3.5 text-xs leading-relaxed border ${
                    isAssistant 
                      ? "bg-zinc-900/60 border-zinc-900 text-zinc-300" 
                      : "bg-emerald-950/20 border-emerald-500/10 text-emerald-300"
                  }`}>
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-2" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-xl p-3.5 text-xs bg-zinc-900/60 border border-zinc-900 text-zinc-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Searching transcript...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form 
            onSubmit={handleSend}
            className="px-6 py-5 border-t border-zinc-900 bg-zinc-950 sticky bottom-0 z-10"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Ask about details, quotes, hardware specs..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-700 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-emerald-500/10 disabled:hover:text-emerald-400"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  )
}
