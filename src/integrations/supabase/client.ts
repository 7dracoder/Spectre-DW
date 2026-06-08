import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured =
  /^https?:\/\//.test(SUPABASE_URL ?? "") &&
  Boolean(SUPABASE_PUBLISHABLE_KEY) &&
  !SUPABASE_URL.includes("your-project") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("your-");

export const supabase = createClient<Database>(
  supabaseConfigured ? SUPABASE_URL : "http://127.0.0.1:54321",
  supabaseConfigured ? SUPABASE_PUBLISHABLE_KEY : "specter-local-anon-key",
  {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
