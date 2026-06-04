import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Prevent error if keys are missing, but warn the user.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl || 'http://placeholder.url', supabaseAnonKey || 'placeholder_key');

export type Insight = {
  id: string;
  source_name: string;
  url: string;
  content_type: string;
  topic_tag: string;
  core_thesis: string[];
  author_context: string;
  market_impact: string;
  tech_impact: string;
  catalysts: string;
  contrarian_view: string;
  signal_score: number;
  created_at: string;
};
