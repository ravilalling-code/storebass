import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  if (supabaseInstance) return supabaseInstance;

  // 1. Variables de entorno de Next.js
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 2. Soporte para credenciales guardadas en LocalStorage
  const storedUrl = localStorage.getItem('storebass_supabase_url');
  const storedKey = localStorage.getItem('storebass_supabase_key');

  const defaultUrl = 'https://zaokqljaadbidnamklvb.supabase.co';
  const url = (storedUrl || envUrl || defaultUrl).trim();
  const key = (storedKey || envKey || '').trim();

  if (!url || !key) {
    // Si aún no se configuró la anon key, retornamos null de forma segura
    return null;
  }

  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.warn('[STORE BASS] Error inicializando cliente Supabase en navegador:', err);
    return null;
  }
}
