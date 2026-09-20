import { notFound } from "next/navigation";
import { getPublicProfileBySlug } from "@/lib/data/public-profile";
import { PublicStats } from "@/components/public/public-stats";

export default async function PublicStatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  return <PublicStats ownerId={profile.id} displayName={profile.display_name} slug={slug} />;
}
