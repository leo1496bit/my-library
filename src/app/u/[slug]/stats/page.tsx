import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicStats } from "@/components/public/public-stats";

export default async function PublicStatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, sharing_enabled")
    .eq("share_slug", slug)
    .eq("sharing_enabled", true)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  return <PublicStats ownerId={profile.id} displayName={profile.display_name} slug={slug} />;
}
