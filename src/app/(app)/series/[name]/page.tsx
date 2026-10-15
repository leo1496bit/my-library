import { SeriesBooks } from "@/components/series/series-books";

export default async function SeriesBooksPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <SeriesBooks name={decodeURIComponent(name)} />;
}
