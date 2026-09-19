"use client";

import { createBrowserClient } from "@supabase/ssr";

// Client Supabase pour les Client Components. À instancier une fois par
// composant/hook (léger) — voir la doc @supabase/ssr.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
