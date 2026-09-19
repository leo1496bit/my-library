// Distingue "la ligne n'existe plus / n'est pas autorisée" d'une vraie
// erreur réseau/serveur, pour que l'appelant puisse réagir différemment
// (ex. fermer une boîte de confirmation dans le premier cas, la laisser
// ouverte pour un nouvel essai dans le second).
export class NotFoundError extends Error {}
