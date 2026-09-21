import { AuthorBooks } from "@/components/authors/author-books";

export default async function AuthorBooksPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <AuthorBooks name={decodeURIComponent(name)} />;
}
