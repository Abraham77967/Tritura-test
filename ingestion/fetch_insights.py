import os
import sys
import json
import feedparser
from youtube_transcript_api import YouTubeTranscriptApi
from youtubesearchpython import VideosSearch
import urllib.parse
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import re

# Load env variables for local testing
load_dotenv()

# Initialize Supabase
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase URL or Key is missing.")
    sys.exit(1)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY is missing.")
    sys.exit(1)
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# List of Search Queries
SEARCH_QUERIES = {
    "youtube": [
        "AI hardware news",
        "LLM breakthrough",
        "Artificial Intelligence financials",
        "GPU market analysis"
    ],
    "rss": [
        "Artificial Intelligence OR GPUs OR LLMs",
        "OpenAI OR Anthropic OR Google DeepMind",
        "AI chips AND market"
    ]
}

SYSTEM_INSTRUCTION = """
You are an expert AI and tech analyst. Act as a STRICT GATEKEEPER.
Before summarizing, determine if the content is explicitly about Artificial Intelligence, compute hardware (GPUs, chips, server cooling), tech company financials, or major technology keynotes.
If it is NOT about these topics (e.g., random vlogs, unrelated industries, vacations), set "is_relevant" to false and leave the rest blank.
If it IS relevant, extract core insights.
Assign the content to one of these three exact categories: "Financial Side", "Technical Stuffs", or "Business Strategy".

Return the result strictly as a valid JSON object matching this schema, without any markdown formatting or code blocks:
{
  "is_relevant": <true or false>,
  "category": "Financial Side" | "Technical Stuffs" | "Business Strategy",
  "topic_tag": "A single word or short phrase describing the specific topic",
  "core_thesis": ["Bullet 1", "Bullet 2", "Bullet 3"],
  "author_context": "1-2 sentences on the speaker's background, track record, and potential biases.",
  "market_impact": "Specific companies, stock tickers, or economic sectors positively or negatively affected.",
  "tech_impact": "How this changes software development, hardware infrastructure, or AI model training.",
  "catalysts": "What specific upcoming events, data releases, or milestones will prove this thesis right or wrong?",
  "contrarian_view": "What is the strongest counter-argument or primary risk to this thesis?",
  "signal_score": <An integer from 1 to 10 evaluating the density and importance of the information>
}
Ensure the response can be directly parsed by json.loads().
"""

def extract_insights(text):
    try:
        response = model.generate_content(
            f"System Instruction:\n{SYSTEM_INSTRUCTION}\n\nContent:\n{text}"
        )
        # Clean up potential markdown formatting from Gemini response
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        parsed = json.loads(response_text)
        return parsed
    except Exception as e:
        print(f"Error extracting insights: {e}")
        return None

def generate_embedding(text):
    try:
        result = genai.embed_content(
            model="models/gemini-embedding-2",
            content=text,
            task_type="retrieval_document",
            output_dimensionality=768
        )
        return result.get('embedding', {}).get('values', [])
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None

def chunk_text(text, chunk_size=500, overlap=100):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += (chunk_size - overlap)
    return chunks

def save_chunks(insight_id, raw_text):
    if not raw_text or not insight_id:
        return
    chunks = chunk_text(raw_text)
    print(f"Splitting raw text into {len(chunks)} chunks for database vector storage...")
    for idx, chunk in enumerate(chunks):
        embedding = generate_embedding(chunk)
        if embedding:
            data = {
                "insight_id": insight_id,
                "chunk_index": idx,
                "content": chunk,
                "embedding": embedding
            }
            try:
                supabase.table("insight_chunks").insert(data).execute()
            except Exception as e:
                print(f"Error saving chunk {idx}: {e}")
    print(f"Successfully saved {len(chunks)} chunks for insight {insight_id}")

def is_url_ingested(url):
    response = supabase.table("insights").select("id").eq("url", url).execute()
    return len(response.data) > 0

def fetch_youtube_insights():
    api = YouTubeTranscriptApi()
    
    for query in SEARCH_QUERIES["youtube"]:
        print(f"Searching YouTube for: {query}")
        try:
            videosSearch = VideosSearch(query, limit=5)
            result = videosSearch.result()
            
            for video in result.get('result', []):
                video_id = video['id']
                video_url = video['link']
                source_name = video.get('channel', {}).get('name', 'YouTube')
                
                if is_url_ingested(video_url):
                    print(f"Already ingested video: {video_id} - skipping.")
                    continue
                    
                print(f"New video found: {video_id} ({video['title']}). Fetching transcript...")
                try:
                    transcript_list = api.list(video_id).find_transcript(['en']).fetch()
                    text = " ".join([t.text for t in transcript_list])
                    
                    # Truncate text if it's exceptionally long
                    text = text[:50000] 
                    
                    insights = extract_insights(text)
                    if insights:
                        if insights.get("is_relevant") is False:
                            print(f"Skipped irrelevant content: {video_id}")
                            continue
                            
                        insight_id = save_to_supabase(
                            source_name=source_name,
                            url=video_url,
                            content_type="video",
                            insights=insights
                        )
                        if insight_id:
                            save_chunks(insight_id, text)
                        time.sleep(15) # Avoid Gemini rate limits
                except Exception as e:
                    print(f"Failed to process YouTube video {video_id}: {e}")
                    
        except Exception as e:
            print(f"Failed to search YouTube for {query}: {e}")

def fetch_rss_insights():
    for query in SEARCH_QUERIES["rss"]:
        print(f"Searching Google News for: {query}")
        encoded_query = urllib.parse.quote(query + " when:1d")
        rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
        
        try:
            feed = feedparser.parse(rss_url)
            if not feed.entries:
                print(f"No articles found for {query}")
                continue
                
            # Process top 5 most recent articles
            for entry in feed.entries[:5]:
                url = entry.link
                if is_url_ingested(url):
                    print(f"Already ingested article: {url} - skipping.")
                    continue
                
                source_name = entry.source.title if hasattr(entry, 'source') else 'Google News'
                
                print(f"New article found at {url}. Extracting insights...")
                # Try to get full content if available, else use description
                content = entry.get('content', [{}])[0].get('value', '')
                if not content:
                    content = entry.get('description', '')
                
                text = entry.title + "\n\n" + content
                # Strip HTML tags (rough approach)
                text = re.sub('<[^<]+>', '', text)
                
                # Truncate text
                text = text[:50000]
                
                insights = extract_insights(text)
                if insights:
                    if insights.get("is_relevant") is False:
                        print(f"Skipped irrelevant content: {url}")
                        continue
                        
                    insight_id = save_to_supabase(
                        source_name=source_name,
                        url=url,
                        content_type="article",
                        insights=insights
                    )
                    if insight_id:
                        save_chunks(insight_id, text)
                    time.sleep(15) # Avoid Gemini rate limits
        except Exception as e:
            print(f"Failed to process RSS feed {query}: {e}")

def save_to_supabase(source_name, url, content_type, insights):
    data = {
        "source_name": source_name,
        "url": url,
        "content_type": content_type,
        "topic_tag": insights.get("category", "Business Strategy"), # Reusing topic_tag for category
        "core_thesis": insights.get("core_thesis", []),
        "author_context": insights.get("author_context", ""),
        "market_impact": insights.get("market_impact", ""),
        "tech_impact": insights.get("tech_impact", ""),
        "catalysts": insights.get("catalysts", ""),
        "contrarian_view": insights.get("contrarian_view", ""),
        "signal_score": insights.get("signal_score", 5)
    }
    
    # Insert new record and return its ID
    try:
        response = supabase.table("insights").insert(data).execute()
        print(f"Successfully ingested and saved: {url}")
        if response.data and len(response.data) > 0:
            return response.data[0]['id']
    except Exception as e:
        print(f"Error saving to Supabase: {e}")
    return None

if __name__ == "__main__":
    print("Starting data ingestion...")
    fetch_youtube_insights()
    fetch_rss_insights()
    print("Ingestion complete.")
