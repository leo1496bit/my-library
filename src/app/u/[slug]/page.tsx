import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicLibrary } from "@/components/public/public-library";

export default async function SharedLibraryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, sharing_enabled, share_slug")
    .eq("share_slug", slug)
    .eq("sharing_enabled", true)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  return <PublicLibrary ownerId={profile.id} displayName={profile.display_name} slug={slug} />;
}
