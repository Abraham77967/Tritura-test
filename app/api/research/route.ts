import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query) {
      return NextResponse.json(
        { error: "Missing query parameter" },
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

    const steps: string[] = []

    // STEP 1: Multi-Step Planning (Parse search query intent)
    steps.push(`Formulating multi-step research plan for query: "${query}"`)
    
    const planningPrompt = `You are an AI research coordinator. The user wants to research: "${query}".
Break down this request and output search terms:
1. "dbQuery": Key terms to search our database of past tech keynotes, hardware specs, and summaries (e.g. "liquid cooling hyperscalers" or "Nvidia revenue").
2. "webQuery": A query to search the live web for the absolute latest news, stock prices, or recent press releases.

Return your response strictly as a valid JSON object matching this schema, without any markdown formatting or code blocks:
{
  "dbQuery": "string",
  "webQuery": "string"
}`

    const planRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: planningPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        })
      }
    )

    if (!planRes.ok) {
      throw new Error(`Gemini planning failed: ${await planRes.text()}`)
    }

    const planData = await planRes.json()
    const planText = planData?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!planText) {
      throw new Error("Empty planning response from Gemini")
    }

    const plan = JSON.parse(planText) as { dbQuery: string; webQuery: string }
    steps.push(`Planning complete. DB Search: "${plan.dbQuery}" | Web Search: "${plan.webQuery}"`)

    // STEP 2: Database Vector Search (Retrieve local context chunks)
    steps.push(`Generating vector embedding for database query: "${plan.dbQuery}"`)
    const embedResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-2",
          content: { parts: [{ text: plan.dbQuery }] },
          outputDimensionality: 768
        })
      }
    )

    let localContextText = ""
    if (embedResponse.ok) {
      const embedData = await embedResponse.json()
      const embedding = embedData?.embedding?.values
      
      if (embedding) {
        steps.push(`Searching local Tritura database for semantically similar transcripts...`)
        // Call RPC searching across ALL insights (filter_insight_id is null/omitted)
        const { data: chunks, error: rpcError } = await supabase.rpc(
          "match_insight_chunks",
          {
            query_embedding: embedding,
            match_threshold: 0.15,
            match_count: 5
          }
        )

        if (rpcError) {
          console.error("Supabase RPC general match error:", rpcError)
          steps.push(`Local search returned an error. Using metadata summaries instead.`)
        } else if (chunks && chunks.length > 0) {
          steps.push(`Retrieved ${chunks.length} matching context slices from database transcripts.`)
          localContextText = (chunks as { content: string }[]).map(c => c.content).join("\n\n---\n\n")
        } else {
          steps.push(`No exact vector slices found. Querying general metadata summaries.`)
        }
      }
    } else {
      console.error("Failed to generate embedding for planning query")
      steps.push("Failed to generate search embedding; skipping vector lookup.")
    }

    // Fallback: Fetch latest insights metadata if vector search is empty
    if (!localContextText) {
      const { data: insights } = await supabase
        .from("insights")
        .select("source_name, topic_tag, core_thesis, market_impact")
        .limit(10)
      
      if (insights && insights.length > 0) {
        localContextText = insights.map(i => 
          `Source: ${i.source_name}\nTag: ${i.topic_tag}\nThesis: ${i.core_thesis?.join(" / ")}\nMarket: ${i.market_impact}`
        ).join("\n\n---\n\n")
      }
    }

    // STEP 3: Google Search Grounded Web Query
    steps.push(`Executing live Google Search grounding query: "${plan.webQuery}"`)
    const searchPrompt = `Search the live web and compile details on: "${plan.webQuery}". Provide concrete details, metrics, and latest news.`
    
    const searchRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: searchPrompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.2
          }
        })
      }
    )

    let webContextText = ""
    let citations: string[] = []

    if (searchRes.ok) {
      const searchData = await searchRes.json()
      const candidate = searchData?.candidates?.[0]
      webContextText = candidate?.content?.parts?.[0]?.text || ""
      
      // Parse citations/grounding metadata if returned
      const grounding = candidate?.groundingMetadata
      if (grounding?.groundingChunks) {
        citations = (grounding.groundingChunks as { web?: { uri?: string }; uri?: string }[])
          .map((chunk) => chunk.web?.uri || chunk.uri)
          .filter((uri): uri is string => typeof uri === "string")
        steps.push(`Google Search successful. Found ${citations.length} live citations.`)
      } else {
        steps.push(`Google Search grounding succeeded.`)
      }
    } else {
      console.error("Gemini Search Grounding failed:", await searchRes.text())
      steps.push("Google Search grounding failed; relying on model pre-trained knowledge.")
      webContextText = "Live search was unavailable. Synthesizing using pre-trained data."
    }

    // STEP 4: Synthesis & Finalized Dossier
    steps.push(`Synthesizing local intelligence and web metrics into a finalized Research Dossier...`)
    
    const synthesisPrompt = `You are a Principal Tech Analyst writing a comprehensive Research Dossier. 
Compile a highly detailed, professional report answering: "${query}".

Ground your report in the following context:

---
CONTEXT 1: LOCAL DATABASE ARCHIVE INTEL (Tritura)
${localContextText}

---
CONTEXT 2: LIVE WEB GROUNDING (Google Search)
${webContextText}
---

Format the output in clean, beautiful Markdown. Include:
1. An Executive Summary.
2. Comparative Analysis (matching archive data against live web news).
3. Financial / Compute metrics tables.
4. Strategic Outlook & Catalysts.
5. Grounding Citations: Add a "Sources" list at the bottom referencing the following web links if relevant:
${citations.join("\n")}

Dossier Output:`

    const finalRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: synthesisPrompt }] }],
          generationConfig: {
            temperature: 0.2
          }
        })
      }
    )

    if (!finalRes.ok) {
      throw new Error(`Gemini synthesis failed: ${await finalRes.text()}`)
    }

    const finalData = await finalRes.json()
    const report = finalData?.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!report) {
      throw new Error("Empty report generated during synthesis")
    }

    steps.push("Autonomous research process complete. Dossier finalized.")

    return NextResponse.json({
      steps,
      report
    })

  } catch (error: unknown) {
    const err = error as Error
    console.error("Autonomous research agent error:", err)
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
