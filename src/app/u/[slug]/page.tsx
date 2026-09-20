import { notFound } from "next/navigation";
import { getPublicProfileBySlug } from "@/lib/data/public-profile";
import { PublicLibrary } from "@/components/public/public-library";

export default async function SharedLibraryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  return <PublicLibrary ownerId={profile.id} displayName={profile.display_name} slug={slug} />;
}
