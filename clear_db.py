import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    load_dotenv(".env")
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(url, key)

print("Fetching all insight IDs to delete...")
# Supabase limit is 1000 per request, we might need to loop, but we only have a few.
response = supabase.table("insights").select("id").execute()
ids = [row["id"] for row in response.data]

print(f"Found {len(ids)} insights. Deleting...")
for insight_id in ids:
    supabase.table("insights").delete().eq("id", insight_id).execute()

print("Database cleared successfully!")
