import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicBookDetail } from "@/components/public/public-book-detail";

export default async function PublicBookDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, sharing_enabled")
    .eq("share_slug", slug)
    .eq("sharing_enabled", true)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  return <PublicBookDetail bookId={id} slug={slug} />;
}
