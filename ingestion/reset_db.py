import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    # Delete all rows where id is not null (which is all rows)
    response = supabase.table("insights").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    print("Successfully deleted all old insights from the database.")
except Exception as e:
    print(f"Error clearing database: {e}")
