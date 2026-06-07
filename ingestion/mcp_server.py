import os
import sys
import json
from mcp.server.fastmcp import FastMCP
from supabase import create_client, Client
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials missing in environment variables.", file=sys.stderr)
    sys.exit(1)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini API for embeddings
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY is not set. Semantic search will fail.", file=sys.stderr)

# Create the FastMCP Server instance
mcp = FastMCP("Tritura Search")

@mcp.tool()
def search_tritura_archive(query: str, limit: int = 5) -> str:
    """Perform a semantic vector similarity search across all tech/financial article and video transcript chunks in Tritura.

    Args:
        query: The search query or question (e.g. 'cooling hardware' or 'Nvidia Blackwell capacity').
        limit: Maximum matching context slices to retrieve (default 5).
    """
    if not GEMINI_API_KEY:
        return "Error: GEMINI_API_KEY is not configured on the server."
    
    try:
        # 1. Generate query embedding using gemini-embedding-2
        result = genai.embed_content(
            model="models/gemini-embedding-2",
            content=query,
            task_type="retrieval_query",
            output_dimensionality=768
        )
        embedding = result.get('embedding', {}).get('values', [])
        
        if not embedding:
            return "Error: Failed to generate embedding for the search query."

        # 2. Query Supabase RPC match_insight_chunks (which does cross-insight search)
        response = supabase.rpc("match_insight_chunks", {
            "query_embedding": embedding,
            "match_threshold": 0.15,
            "match_count": limit
        }).execute()

        if not response.data:
            return "No semantically matching context slices found in Tritura database transcripts."

        # 3. Format and return results
        output = []
        for idx, chunk in enumerate(response.data):
            similarity = chunk.get('similarity', 0.0)
            content = chunk.get('content', '')
            output.append(f"Result #{idx+1} [Similarity: {similarity:.2f}]:\n{content}\n")
        
        return "\n---\n".join(output)
    except Exception as e:
        return f"Error executing semantic search: {e}"

@mcp.tool()
def get_latest_signals(limit: int = 5) -> str:
    """Retrieve the most recent high-signal intelligence entries from the Tritura database.

    Args:
        limit: Maximum number of recent signals to return (default 5).
    """
    try:
        response = supabase.table("insights") \
            .select("source_name, topic_tag, core_thesis, signal_score, created_at") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        
        if not response.data:
            return "No signals found in the database."

        output = []
        for idx, item in enumerate(response.data):
            thesis = " / ".join(item.get('core_thesis', []))
            output.append(
                f"Signal #{idx+1} | Source: {item.get('source_name')} | Score: {item.get('signal_score')}/10 | Tag: {item.get('topic_tag')}\n"
                f"Processed: {item.get('created_at')}\n"
                f"Thesis: {thesis}\n"
            )
        return "\n---\n".join(output)
    except Exception as e:
        return f"Error fetching latest signals: {e}"

@mcp.tool()
def trigger_data_ingestion() -> str:
    """Trigger the crawler pipelines to scrape, evaluate, and index new RSS articles and YouTube transcripts."""
    try:
        import subprocess
        script_path = os.path.join(os.path.dirname(__file__), "fetch_insights.py")
        result = subprocess.run([sys.executable, script_path], capture_output=True, text=True, check=True)
        return f"Ingestion process completed successfully.\nOutput:\n{result.stdout}"
    except Exception as e:
        return f"Error triggering ingestion pipeline: {e}"

if __name__ == "__main__":
    mcp.run(transport='stdio')
