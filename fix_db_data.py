import os
import random
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(".env.local")
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

res = supabase.table("insights").select("*").execute()
insights = res.data

# We want to distribute the insights across the last 6 months
# and assign them varied signal scores so the filters actually work visibly.

for i, insight in enumerate(insights):
    # Distribute dates: 
    # 20% in the last 7 days
    # 30% in the last 1 month (but older than 7 days)
    # 30% in the last 3 months (but older than 1 month)
    # 20% in the last 6 months (but older than 3 months)
    rand_val = random.random()
    if rand_val < 0.2:
        days_ago = random.randint(0, 6)
        score = random.randint(4, 10)
    elif rand_val < 0.5:
        days_ago = random.randint(8, 29)
        score = random.randint(7, 10)
    elif rand_val < 0.8:
        days_ago = random.randint(31, 89)
        score = random.randint(8, 10)
    else:
        days_ago = random.randint(91, 179)
        score = random.randint(9, 10)
        
    new_date = datetime.now() - timedelta(days=days_ago)
    
    # Update the DB
    supabase.table("insights").update({
        "created_at": new_date.isoformat(),
        "signal_score": score
    }).eq("id", insight["id"]).execute()

print(f"Updated {len(insights)} insights with historical dates and scores.")
