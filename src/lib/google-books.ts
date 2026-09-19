// Client pour l'API Google Books — recherche et enrichissement automatique
// des métadonnées d'un livre (auteur, couverture, éditeur, pages, ISBN...).
//
// N'est appelé que côté serveur (route handlers) pour ne jamais exposer une
// éventuelle clé API au navigateur et pour éviter les soucis de CORS.

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

export interface GoogleBookResult {
  googleBooksId: string;
  title: string;
  author: string | null;
  genre: string | null;
  isbn: string | null;
  coverUrl: string | null;
  publisher: string | null;
  publishedYear: number | null;
  language: string | null;
  pageCount: number | null;
  description: string | null;
}

interface GoogleVolumeItem {
  id: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    categories?: string[];
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    language?: string;
    description?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

function upgradeCoverUrl(url: string | undefined): string | null {
  if (!url) return null;
  // Google renvoie du http:// et une petite taille par défaut ; on force
  // https et une résolution un peu plus grande pour la fiche livre.
  return url.replace(/^http:\/\//, "https://").replace("zoom=1", "zoom=2");
}

function extractIsbn(
  identifiers: { type: string; identifier: string }[] | undefined,
): string | null {
  if (!identifiers?.length) return null;
  const isbn13 = identifiers.find((i) => i.type === "ISBN_13");
  if (isbn13) return isbn13.identifier;
  const isbn10 = identifiers.find((i) => i.type === "ISBN_10");
  return isbn10?.identifier ?? null;
}

function extractYear(publishedDate: string | undefined): number | null {
  if (!publishedDate) return null;
  const match = publishedDate.match(/^\d{4}/);
  return match ? Number(match[0]) : null;
}

function mapVolume(item: GoogleVolumeItem): GoogleBookResult | null {
  const info = item.volumeInfo;
  if (!info?.title) return null;

  return {
    googleBooksId: item.id,
    title: info.subtitle ? `${info.title} : ${info.subtitle}` : info.title,
    author: info.authors?.join(", ") ?? null,
    genre: info.categories?.[0] ?? null,
    isbn: extractIsbn(info.industryIdentifiers),
    coverUrl: upgradeCoverUrl(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
    publisher: info.publisher ?? null,
    publishedYear: extractYear(info.publishedDate),
    language: info.language ?? null,
    pageCount: info.pageCount ?? null,
    description: info.description ?? null,
  };
}

async function fetchVolumes(params: URLSearchParams): Promise<GoogleBookResult[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) params.set("key", apiKey);

  const res = await fetch(`${GOOGLE_BOOKS_API}?${params.toString()}`, {
    // Les résultats de recherche changent peu ; on peut les mettre en cache
    // brièvement côté edge/serveur.
    next: { revalidate: 60 * 60 },
  });

  if (!res.ok) {
    throw new Error(`Google Books API a répondu ${res.status}`);
  }

  const data = (await res.json()) as { items?: GoogleVolumeItem[] };
  if (!data.items?.length) return [];

  return data.items
    .map(mapVolume)
    .filter((b): b is GoogleBookResult => b !== null);
}

export async function searchBooksByTitle(
  query: string,
  maxResults = 8,
): Promise<GoogleBookResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({
    q: `intitle:${trimmed}`,
    maxResults: String(maxResults),
    printType: "books",
  });

  return fetchVolumes(params);
}

export async function searchBooksByAuthor(
  author: string,
  maxResults = 10,
): Promise<GoogleBookResult[]> {
  const trimmed = author.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({
    q: `inauthor:"${trimmed}"`,
    maxResults: String(maxResults),
    printType: "books",
    orderBy: "relevance",
  });

  return fetchVolumes(params);
}

export async function searchBooksBySubject(
  subject: string,
  maxResults = 10,
): Promise<GoogleBookResult[]> {
  const trimmed = subject.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({
    q: `subject:"${trimmed}"`,
    maxResults: String(maxResults),
    printType: "books",
    orderBy: "relevance",
  });

  return fetchVolumes(params);
}
