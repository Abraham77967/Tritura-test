import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { insightId, message } = await req.json()

    if (!insightId || !message) {
      return NextResponse.json(
        { error: "Missing insightId or message" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY in environment variables")
      return NextResponse.json(
        { error: "API key configuration error" },
        { status: 500 }
      )
    }

    // 1. Generate embedding for the user message using gemini-embedding-2
    const embedResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "models/gemini-embedding-2",
          content: {
            parts: [{ text: message }],
          },
          outputDimensionality: 768
        }),
      }
    )

    if (!embedResponse.ok) {
      const errorText = await embedResponse.text()
      console.error("Gemini embedding API error:", errorText)
      throw new Error("Failed to generate embedding")
    }

    const embedData = await embedResponse.json()
    const embedding = embedData?.embedding?.values

    if (!embedding) {
      throw new Error("Invalid embedding response structure")
    }

    // 2. Query Supabase RPC match_insight_chunks
    const { data: chunks, error: rpcError } = await supabase.rpc(
      "match_insight_chunks",
      {
        query_embedding: embedding,
        match_threshold: 0.2, // similarity threshold
        match_count: 5,       // return top 5 chunks
        filter_insight_id: insightId,
      }
    )

    if (rpcError) {
      console.error("Supabase RPC match error:", rpcError)
    }

    // 3. Fetch the metadata summary from insights table to have fallback or extra context
    const { data: insight, error: dbError } = await supabase
      .from("insights")
      .select("*")
      .eq("id", insightId)
      .single()

    if (dbError || !insight) {
      return NextResponse.json(
        { error: "Insight not found in database" },
        { status: 404 }
      )
    }

    // 4. Construct prompt based on whether chunks are found
    let prompt = ""
    if (chunks && chunks.length > 0) {
      const contextText = (chunks as { content: string }[]).map((c) => c.content).join("\n\n---\n\n")
      prompt = `You are a high-signal tech analyst. Answer the user's question about the technical/financial signal based on the context retrieved from the raw transcript or article.
      
If the context does not contain the answer, use the core summary metadata (thesis, impacts) listed below to answer. Do not make up facts.

Core Thesis: ${insight.core_thesis?.join(" / ")}
Market Impact: ${insight.market_impact}
Tech Impact: ${insight.tech_impact}

Retrieved Transcript Context:
${contextText}

User Question: ${message}
Answer:`
    } else {
      // Fallback if transcript was not chunked/ingested
      prompt = `You are a high-signal tech analyst. Answer the user's question about this intelligence signal using the summary metadata. Note: The raw transcript vector database is empty for this entry, so restrict your answers to the metadata below. Do not hallucinate.

Source: ${insight.source_name}
Core Thesis: ${insight.core_thesis?.join(" / ")}
Market Impact: ${insight.market_impact}
Tech Impact: ${insight.tech_impact}
Contrarian View: ${insight.contrarian_view}
Catalysts: ${insight.catalysts}

User Question: ${message}
Answer:`
    }

    // 5. Query Gemini API for completion
    const chatResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    )

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text()
      console.error("Gemini generation API error:", errorText)
      throw new Error("Failed to generate answer")
    }

    const chatData = await chatResponse.json()
    const reply = chatData?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!reply) {
      throw new Error("Invalid generation response structure")
    }

    return NextResponse.json({ reply })
  } catch (error: unknown) {
    const err = error as Error
    console.error("RAG Chat API error:", err)
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
