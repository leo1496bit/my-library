import { NextResponse, type NextRequest } from "next/server";
import { searchBooksByTitle } from "@/lib/google-books";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchBooksByTitle(q, 10);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Google Books search failed", error);
    // On ne bloque jamais l'utilisateur : résultats vides, le client bascule
    // sur le formulaire d'ajout manuel.
    return NextResponse.json(
      { results: [], error: "unavailable" },
      { status: 200 },
    );
  }
}
