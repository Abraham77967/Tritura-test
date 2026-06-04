import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(".env.local")
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

res = supabase.table("insights").select("*").execute()

import collections
counts = collections.Counter(r.get('topic_tag') for r in res.data)
print(f"Total insights: {len(res.data)}")
print(f"Categories: {counts}")

for r in res.data:
    print(f"{r.get('created_at')} | {r.get('topic_tag')} | {r.get('source_name')} | {r.get('is_relevant')}")
