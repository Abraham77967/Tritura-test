import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(".env.local")
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

res = supabase.table("insights").select("signal_score").execute()

scores = [r.get('signal_score') for r in res.data]
import collections
print("Signal score distribution:", collections.Counter(scores))
