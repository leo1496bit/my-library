import { NextResponse, type NextRequest } from "next/server";
import { looksLikeIsbn, searchBooksByIsbn, searchBooksByTitle } from "@/lib/google-books";
import { searchOpenLibraryByIsbn, searchOpenLibraryByTitle } from "@/lib/open-library";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const trimmed = q.trim();

  if (!trimmed) {
    return NextResponse.json({ results: [] });
  }

  // Une saisie qui ressemble à un ISBN (Quick Add, ou futur scan de
  // code-barres mobile qui remplira ce même champ) passe par la recherche
  // ISBN plutôt que par le titre, bien plus précise pour cette forme.
  const isIsbn = looksLikeIsbn(trimmed);

  try {
    const results = isIsbn
      ? await searchBooksByIsbn(trimmed, 10)
      : await searchBooksByTitle(trimmed, 10);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Google Books search failed, falling back to Open Library", error);
  }

  // Google Books rejette par épisodes des rafales entières d'appels (503),
  // nouvelles tentatives comprises : on bascule sur Open Library plutôt que
  // de laisser l'utilisateur sans résultat. Seulement sur erreur — une
  // recherche Google sans résultat reste une vraie réponse.
  try {
    const results = isIsbn
      ? await searchOpenLibraryByIsbn(trimmed, 10)
      : await searchOpenLibraryByTitle(trimmed, 10);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Open Library search failed", error);
    // On ne bloque jamais l'utilisateur : résultats vides, le client propose
    // de réessayer ou bascule sur le formulaire d'ajout manuel.
    return NextResponse.json({ results: [], error: "unavailable" }, { status: 200 });
  }
}
