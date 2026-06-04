import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Validate URL protocol to prevent build-time crashes with malformed env variables
let validatedUrl = 'http://placeholder.url';
if (supabaseUrl) {
  try {
    const parsedUrl = new URL(supabaseUrl);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      validatedUrl = supabaseUrl;
    }
  } catch (err) {
    console.error('Invalid NEXT_PUBLIC_SUPABASE_URL provided:', supabaseUrl);
  }
}

export const supabase = createClient(validatedUrl, supabaseAnonKey || 'placeholder_key');

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
