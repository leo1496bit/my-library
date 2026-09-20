import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Résout un profil public par son share_slug — passe par la fonction
// SECURITY DEFINER get_public_profile_by_slug plutôt qu'un select direct sur
// `profiles`, dont la RLS ne peut filtrer un visiteur anonyme que par
// sharing_enabled, jamais par slug (donc énumérable), voir
// supabase/migrations/0007_fix_profile_enumeration_and_book_idor.sql.
export async function getPublicProfileBySlug(slug: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_profile_by_slug", { p_slug: slug });
  return data?.[0] ?? null;
}
