// Suggère, parmi les tags déjà créés par l'utilisateur, ceux qui semblent
// correspondre à un livre trouvé sur Google Books — pour pré-cocher des
// tags à l'ajout plutôt que de partir d'une liste vide à chaque fois.
//
// Heuristique volontairement simple (pas d'appel à un modèle en temps réel
// depuis l'ajout rapide) : correspondance texte entre le nom du tag et le
// genre/la description du livre, avec un petit pont de mots-clés pour les
// grandes catégories Google Books (souvent en anglais) vers leurs
// équivalents français les plus courants.
import type { Tag } from "@/lib/types";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  philosophie: ["philosophy", "philosoph"],
  religion: ["religion", "religious", "theology", "theologie"],
  politique: ["political", "politics", "government"],
  histoire: ["history", "historical"],
  economie: ["economics", "business", "economy"],
  "sciences sociales": ["social science", "sociology", "sociologie"],
  dystopie: ["dystopia", "dystopian"],
};

export function suggestTagsForBook(
  book: { genre?: string | null; description?: string | null },
  allTags: Tag[],
): Tag[] {
  const haystack = normalize(`${book.genre ?? ""} ${book.description ?? ""}`);
  if (!haystack) return [];

  return allTags.filter((tag) => {
    const tagName = normalize(tag.name);
    if (!tagName) return false;
    if (haystack.includes(tagName)) return true;
    return CATEGORY_KEYWORDS[tagName]?.some((keyword) => haystack.includes(keyword)) ?? false;
  });
}
