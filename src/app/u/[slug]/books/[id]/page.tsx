import { notFound } from "next/navigation";
import { getPublicProfileBySlug } from "@/lib/data/public-profile";
import { PublicBookDetail } from "@/components/public/public-book-detail";

export default async function PublicBookDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  return <PublicBookDetail bookId={id} ownerId={profile.id} slug={slug} />;
}
