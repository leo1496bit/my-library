import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

// Volontairement accessible même connecté (contrairement à /login et
// /signup, qui redirigent vers /library) : un visiteur déjà inscrit doit
// pouvoir revenir consulter cette page, pas juste au tout premier passage.
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPage isAuthenticated={Boolean(user)} />;
}
