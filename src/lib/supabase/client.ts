import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

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

  const defaultUrl = 'https://iolvevkovlogbsluqkwe.supabase.co';
  const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbHZldmtvdmxvZ2JzbHVxa3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNTM2NTIsImV4cCI6MjEwNjcyOTY1Mn0.2bMKVlFx1SNCOEWlZ8vtgI-iklMDUo2nhAWl-KccBT4';
  const url = (storedUrl || envUrl || defaultUrl).trim();
  const key = (storedKey || envKey || defaultKey).trim();

  if (!url || !key) {
    return null;
  }

  try {
    // createBrowserClient de @supabase/ssr gestiona automáticamente cookies de sesión para Next.js
    supabaseInstance = createBrowserClient(url, key);
    return supabaseInstance;
  } catch (err) {
    console.warn('[STORE BASS] Error inicializando cliente Supabase en navegador:', err);
    return null;
  }
}
