import { NextResponse, type NextRequest } from "next/server";
import { looksLikeIsbn, searchBooksByIsbn, searchBooksByTitle } from "@/lib/google-books";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const trimmed = q.trim();

  if (!trimmed) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Une saisie qui ressemble à un ISBN (Quick Add, ou futur scan de
    // code-barres mobile qui remplira ce même champ) passe par la recherche
    // ISBN plutôt que par le titre, bien plus précise pour cette forme.
    const results = looksLikeIsbn(trimmed)
      ? await searchBooksByIsbn(trimmed, 10)
      : await searchBooksByTitle(trimmed, 10);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Google Books search failed", error);
    // On ne bloque jamais l'utilisateur : résultats vides, le client bascule
    // sur le formulaire d'ajout manuel.
    return NextResponse.json({ results: [], error: "unavailable" }, { status: 200 });
  }
}
