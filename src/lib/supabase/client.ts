import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    console.error(
      '[STORE BASS] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
    return null;
  }

  try {
    // Una única instancia mantiene la misma sesión Auth para consultas, mutaciones y Realtime.
    supabaseInstance = createBrowserClient(url, key);
    return supabaseInstance;
  } catch (err) {
    console.error('[STORE BASS] Error inicializando cliente Supabase:', err);
    return null;
  }
}
