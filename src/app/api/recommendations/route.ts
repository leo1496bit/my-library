import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  searchBooksByAuthor,
  searchBooksBySubject,
  type GoogleBookResult,
} from "@/lib/google-books";

const MAX_RECOMMENDATIONS = 12;

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: books, error } = await supabase
    .from("books")
    .select("title, author, genre, isbn, google_books_id, rating")
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to load books for recommendations", error);
    return NextResponse.json({ recommendations: [] });
  }

  if (!books?.length) {
    return NextResponse.json({ recommendations: [] });
  }

  // Auteurs/genres pondérés : fréquence + bonus pour les livres bien notés.
  const authorScores = new Map<string, number>();
  const genreScores = new Map<string, number>();

  for (const book of books) {
    const weight = 1 + (book.rating ?? 0) * 0.5;
    if (book.author) {
      const key = book.author.split(",")[0].trim();
      if (key) authorScores.set(key, (authorScores.get(key) ?? 0) + weight);
    }
    if (book.genre) {
      genreScores.set(book.genre, (genreScores.get(book.genre) ?? 0) + weight);
    }
  }

  const topAuthors = [...authorScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const topGenres = [...genreScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name);

  if (!topAuthors.length && !topGenres.length) {
    return NextResponse.json({ recommendations: [] });
  }

  const ownedIsbns = new Set(books.map((b) => normalize(b.isbn)).filter(Boolean));
  const ownedGoogleIds = new Set(books.map((b) => b.google_books_id).filter(Boolean));
  const ownedTitleAuthor = new Set(
    books.map((b) => `${normalize(b.title)}::${normalize(b.author)}`),
  );

  function isOwned(candidate: GoogleBookResult) {
    if (candidate.isbn && ownedIsbns.has(normalize(candidate.isbn))) return true;
    if (ownedGoogleIds.has(candidate.googleBooksId)) return true;
    if (ownedTitleAuthor.has(`${normalize(candidate.title)}::${normalize(candidate.author)}`))
      return true;
    return false;
  }

  try {
    const [byAuthor, bySubject] = await Promise.all([
      Promise.all(topAuthors.map((a) => searchBooksByAuthor(a, 6))),
      Promise.all(topGenres.map((g) => searchBooksBySubject(g, 6))),
    ]);

    const seen = new Set<string>();
    const recommendations: (GoogleBookResult & { reason: string })[] = [];

    function pushCandidates(list: GoogleBookResult[], reason: string) {
      for (const candidate of list) {
        if (seen.has(candidate.googleBooksId)) continue;
        if (isOwned(candidate)) continue;
        seen.add(candidate.googleBooksId);
        recommendations.push({ ...candidate, reason });
      }
    }

    topAuthors.forEach((author, i) => pushCandidates(byAuthor[i], `Du même auteur : ${author}`));
    topGenres.forEach((genre, i) => pushCandidates(bySubject[i], `Dans le genre ${genre}`));

    return NextResponse.json({
      recommendations: recommendations.slice(0, MAX_RECOMMENDATIONS),
    });
  } catch (err) {
    console.error("Recommendations lookup failed", err);
    return NextResponse.json({ recommendations: [] });
  }
}
