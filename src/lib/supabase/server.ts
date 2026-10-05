import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iolvevkovlogbsluqkwe.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbHZldmtvdmxvZ2JzbHVxa3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNTM2NTIsImV4cCI6MjEwNjcyOTY1Mn0.2bMKVlFx1SNCOEWlZ8vtgI-iklMDUo2nhAWl-KccBT4';

  if (!url || !key) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // El método fue invocado desde un Server Component
        }
      },
    },
  });
}
