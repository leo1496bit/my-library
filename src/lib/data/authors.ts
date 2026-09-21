// Regroupement des livres par auteur (voir CONTEXT.md — le champ `author`
// d'un Book est une chaîne éventuellement multi-auteurs, jointe par ", " au
// moment du Quick Add, voir src/lib/google-books.ts). Fonctions pures,
// aucun accès réseau : la donnée vient de fetchBooksWithRelations
// (src/lib/data/books.ts), déjà chargée par l'appelant.

import type { BookWithRelations } from "@/lib/types";

export interface AuthorEntry {
  name: string;
  books: BookWithRelations[];
}

function splitAuthors(author: string | null): string[] {
  if (!author) return [];
  return author
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

// Clé de regroupement : insensible à la casse, aux accents et aux espaces
// multiples, pour que "Émile Zola", "emile zola" et "Emile  Zola" (des
// variantes venant de saisies ou d'éditions Google Books différentes)
// tombent sous la même clé.
function normalizeAuthorName(name: string): string {
  return name.replace(/\s+/g, " ").trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Deux clés sont apparentées si l'une contient tous les mots de l'autre —
// couvre le cas fréquent où Google Books indexe un même auteur avec ou sans
// prénom sur des livres différents (ex. "Dostoïevski" sur l'un, "Fedor
// Dostoïevski" sur l'autre). Un simple sous-ensemble de mots, sans exiger
// l'ordre, suffit et reste tolérant à "Nom Prénom" vs "Prénom Nom".
function namesAreRelated(a: string, b: string): boolean {
  const tokensA = a.split(" ");
  const tokensB = b.split(" ");
  const [shorter, longer] =
    tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  const longerSet = new Set(longer);
  return shorter.every((t) => longerSet.has(t));
}

// La graphie affichée pour un groupe est la plus complète (le plus de
// mots) parmi les variantes vues — "Fedor Dostoïevski" plutôt que
// "Dostoïevski" seul — et à complétude égale, la plus fréquente ; à
// égalité, la première rencontrée.
function pickDisplayName(variants: Map<string, number>): string {
  let best = "";
  let bestTokenCount = -1;
  let bestCount = -1;
  for (const [name, count] of variants) {
    const tokenCount = name.split(/\s+/).length;
    if (tokenCount > bestTokenCount || (tokenCount === bestTokenCount && count > bestCount)) {
      best = name;
      bestTokenCount = tokenCount;
      bestCount = count;
    }
  }
  return best;
}

interface AuthorNode {
  key: string;
  variants: Map<string, number>;
  books: Map<string, BookWithRelations>;
}

/** Un livre à plusieurs auteurs apparaît sous chacun d'eux. Les variantes de
 * graphie d'un même auteur (casse, accents, espaces, prénom présent ou non)
 * sont fusionnées. Tri alphabétique (locale fr) sur le nom affiché. */
export function groupBooksByAuthor(books: BookWithRelations[]): AuthorEntry[] {
  const nodes = new Map<string, AuthorNode>();

  for (const book of books) {
    for (const rawName of splitAuthors(book.author)) {
      const key = normalizeAuthorName(rawName);
      if (!key) continue;
      let node = nodes.get(key);
      if (!node) {
        node = { key, variants: new Map(), books: new Map() };
        nodes.set(key, node);
      }
      node.variants.set(rawName, (node.variants.get(rawName) ?? 0) + 1);
      node.books.set(book.id, book);
    }
  }

  // Union-find par sous-ensemble de mots, pour fusionner les clés
  // apparentées (ex. "dostoievski" et "fedor dostoievski") en un seul
  // groupe, indépendamment de l'ordre dans lequel les livres arrivent.
  const keys = [...nodes.keys()];
  const parent = new Map(keys.map((k) => [k, k]));
  function find(k: string): string {
    let root = k;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let cur = k;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  }
  function union(a: string, b: string) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootA, rootB);
  }
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      if (namesAreRelated(keys[i], keys[j])) union(keys[i], keys[j]);
    }
  }

  const clusters = new Map<string, AuthorNode[]>();
  for (const key of keys) {
    const root = find(key);
    const list = clusters.get(root) ?? [];
    list.push(nodes.get(key)!);
    clusters.set(root, list);
  }

  return [...clusters.values()]
    .map((clusterNodes) => {
      const variants = new Map<string, number>();
      const booksById = new Map<string, BookWithRelations>();
      for (const node of clusterNodes) {
        for (const [name, count] of node.variants)
          variants.set(name, (variants.get(name) ?? 0) + count);
        for (const [id, book] of node.books) booksById.set(id, book);
      }
      return { name: pickDisplayName(variants), books: [...booksById.values()] };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** Livres d'un auteur donné — `authorName` doit être le nom tel que renvoyé
 * par groupBooksByAuthor (ex. depuis l'URL /authors/[name]), les plus
 * récemment ajoutés d'abord. */
export function booksByAuthor(books: BookWithRelations[], authorName: string): BookWithRelations[] {
  const key = normalizeAuthorName(authorName);
  const entry = groupBooksByAuthor(books).find((e) => normalizeAuthorName(e.name) === key);
  if (!entry) return [];
  return [...entry.books].sort((a, b) => b.date_added.localeCompare(a.date_added));
}
