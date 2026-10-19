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

export function upgradeCoverUrl(url: string | undefined): string | null {
  if (!url) return null;
  // Google renvoie du http:// et une petite taille par défaut ; on force
  // https et une résolution un peu plus grande pour la fiche livre.
  return url.replace(/^http:\/\//, "https://").replace("zoom=1", "zoom=2");
}

export function extractIsbn(
  identifiers: { type: string; identifier: string }[] | undefined,
): string | null {
  if (!identifiers?.length) return null;
  const isbn13 = identifiers.find((i) => i.type === "ISBN_13");
  if (isbn13) return isbn13.identifier;
  const isbn10 = identifiers.find((i) => i.type === "ISBN_10");
  return isbn10?.identifier ?? null;
}

export function extractYear(publishedDate: string | undefined): number | null {
  if (!publishedDate) return null;
  const match = publishedDate.match(/^\d{4}/);
  return match ? Number(match[0]) : null;
}

// Retire les espaces et tirets de mise en forme (ex. "978-2-07-036822-8")
// avant d'interroger l'API ou de tester la forme d'un ISBN.
function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, "");
}

// Détecte une saisie "qui ressemble à un ISBN" (10 ou 13 chiffres, avec ou
// sans tirets/espaces) plutôt qu'un titre — utilisé pour aiguiller la
// recherche Quick Add vers `searchBooksByIsbn`. Même détection que servira
// plus tard un scan de code-barres mobile, qui remplira ce même champ.
export function looksLikeIsbn(query: string): boolean {
  const normalized = normalizeIsbn(query.trim());
  // ISBN-10 : 9 chiffres + un chiffre de contrôle (chiffre ou X).
  // ISBN-13 : 13 chiffres (le chiffre de contrôle est toujours un chiffre).
  return /^\d{9}[\dXx]$/.test(normalized) || /^\d{13}$/.test(normalized);
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

async function fetchVolumesOnce(params: URLSearchParams): Promise<Response> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) params.set("key", apiKey);

  return fetch(`${GOOGLE_BOOKS_API}?${params.toString()}`, {
    // Les résultats de recherche changent peu ; on peut les mettre en cache
    // brièvement côté edge/serveur.
    next: { revalidate: 60 * 60 },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchVolumes(params: URLSearchParams): Promise<GoogleBookResult[]> {
  let res = await fetchVolumesOnce(new URLSearchParams(params));
  // L'API Google Books connaît des épisodes d'instabilité où une bonne partie
  // des appels renvoient une 5xx transitoire ("Service temporarily
  // unavailable") sans rapport avec la requête elle-même — un taux de 50%
  // d'échec a été mesuré en conditions réelles, donc une seule nouvelle
  // tentative ne suffit pas à absorber ça de façon fiable (il faudrait encore
  // ~25% d'échec résiduel). Jusqu'à 2 tentatives supplémentaires, avec un
  // petit délai croissant pour laisser l'épisode se dissiper plutôt que de
  // marteler un backend déjà en difficulté. Pas de retry sur 4xx : une requête
  // mal formée ou un quota dépassé ne se résout pas en réessayant.
  for (let attempt = 1; !res.ok && res.status >= 500 && attempt <= 2; attempt++) {
    await sleep(attempt * 300);
    res = await fetchVolumesOnce(new URLSearchParams(params));
  }

  if (!res.ok) {
    throw new Error(`Google Books API a répondu ${res.status}`);
  }

  const data = (await res.json()) as { items?: GoogleVolumeItem[] };
  if (!data.items?.length) return [];

  const results = data.items.map(mapVolume).filter((b): b is GoogleBookResult => b !== null);

  // L'API renvoie parfois deux fois le même volume (mêmes filtres appliqués
  // à des requêtes qui se chevauchent) — dédoublonné ici plutôt que dans
  // chaque UI qui affiche des résultats de recherche.
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.googleBooksId)) return false;
    seen.add(r.googleBooksId);
    return true;
  });
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

export async function searchBooksByIsbn(isbn: string, maxResults = 5): Promise<GoogleBookResult[]> {
  const normalized = normalizeIsbn(isbn.trim());
  if (!normalized) return [];

  const params = new URLSearchParams({
    q: `isbn:${normalized}`,
    maxResults: String(maxResults),
    printType: "books",
  });

  return fetchVolumes(params);
}

// Recommandations : on préfère les éditions françaises (la bibliothèque de
// l'utilisateur est en français), mais on complète avec l'édition d'origine
// quand aucune traduction n'existe plutôt que de ne rien recommander.
async function fetchVolumesPreferringFrench(
  baseParams: URLSearchParams,
  maxResults: number,
): Promise<GoogleBookResult[]> {
  const frenchParams = new URLSearchParams(baseParams);
  frenchParams.set("langRestrict", "fr");
  frenchParams.set("maxResults", String(maxResults));
  const frenchResults = await fetchVolumes(frenchParams);

  if (frenchResults.length >= maxResults) return frenchResults;

  const fallbackParams = new URLSearchParams(baseParams);
  fallbackParams.set("maxResults", String(maxResults));
  const fallbackResults = await fetchVolumes(fallbackParams);

  const seen = new Set(frenchResults.map((r) => r.googleBooksId));
  const merged = [...frenchResults];
  for (const r of fallbackResults) {
    if (merged.length >= maxResults) break;
    if (seen.has(r.googleBooksId)) continue;
    seen.add(r.googleBooksId);
    merged.push(r);
  }
  return merged;
}

export async function searchBooksByAuthor(
  author: string,
  maxResults = 10,
): Promise<GoogleBookResult[]> {
  const trimmed = author.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({
    q: `inauthor:"${trimmed}"`,
    printType: "books",
    orderBy: "relevance",
  });

  return fetchVolumesPreferringFrench(params, maxResults);
}

export async function searchBooksBySubject(
  subject: string,
  maxResults = 10,
): Promise<GoogleBookResult[]> {
  const trimmed = subject.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({
    q: `subject:"${trimmed}"`,
    printType: "books",
    orderBy: "relevance",
  });

  return fetchVolumesPreferringFrench(params, maxResults);
}
