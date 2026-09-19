# Ma bibliothèque

Application de gestion de bibliothèque personnelle : ajout ultra-rapide de
livres (auto-complété via Google Books), suivi de lecture, prêts, import CSV,
statistiques et recommandations. Multi-utilisateur, données strictement
isolées par utilisateur (Supabase Auth + Row Level Security).

## Stack

- **Next.js 16** (App Router, TypeScript) — déployé sur Vercel
- **Supabase** — Postgres, Auth, Row Level Security
- **shadcn/ui** + Tailwind CSS v4
- **Google Books API** — enrichissement automatique des métadonnées

## 1. Créer le projet Supabase

1. Sur [supabase.com](https://supabase.com), créez un nouveau projet.
2. Dans **SQL Editor**, exécutez le contenu de
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
   Il crée les tables `books`, `loans`, `tags`, `book_tags`,
   `reading_goals`, active **Row Level Security** sur chacune et pose les
   policies qui isolent les données par utilisateur (`auth.uid() = user_id`).
3. Dans **Authentication > Providers**, l'e-mail/mot de passe est actif par
   défaut. Pour désactiver la confirmation par e-mail en développement :
   **Authentication > Settings > Email Auth > Confirm email** (à décocher).
4. Récupérez l'URL du projet et la clé `anon public` dans
   **Project Settings > API**.

### Vérifier l'isolation RLS

Avec deux comptes de test (A et B), créez un livre avec A puis, connecté en
B, vérifiez que `/library` ne montre aucun livre de A et qu'une requête
directe sur l'`id` d'un livre de A renvoie « introuvable ». Les policies
`*_select_own` / `*_insert_own` / `*_update_own` / `*_delete_own` de la
migration couvrent ce cas sur les quatre tables.

## 2. Variables d'environnement

Copiez `.env.example` vers `.env.local` et complétez :

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` : requis.
- `GOOGLE_BOOKS_API_KEY` : optionnel. Sans clé, l'API Google Books répond
  avec un quota réduit mais fonctionne. Avec clé (Google Cloud Console,
  API "Books API"), le quota est bien plus élevé. Dans tous les cas, si
  Google Books est indisponible, l'ajout bascule automatiquement sur le
  formulaire manuel — l'utilisateur n'est jamais bloqué.

## 3. Lancer en local

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) — vous serez redirigé
vers `/login`. Créez un compte, puis ajoutez votre premier livre via le
bouton flottant « + ».

## 4. Déployer

1. Poussez le dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com), importez le dépôt.
3. Renseignez les mêmes variables d'environnement que `.env.local` dans
   **Project Settings > Environment Variables**.
4. Chaque push sur la branche par défaut redéploie automatiquement.

## Structure

```
src/
  app/
    (auth)/login, (auth)/signup     — authentification
    (app)/library                   — bibliothèque (liste + filtres)
    (app)/books/[id]                — fiche livre éditable
    (app)/loans                     — prêts en cours / historique
    (app)/import                    — import CSV
    (app)/stats                     — statistiques de lecture
    (app)/recommendations           — suggestions Google Books
    api/books/search                — proxy Google Books (recherche)
    api/recommendations             — calcul des suggestions
  components/                       — composants par domaine (add, books, loans, stats…)
  lib/
    supabase/                       — clients browser / server / middleware
    google-books.ts                 — client Google Books API
    actions/                        — Server Actions (auth, ajout de livre)
    stats.ts, csv.ts, types.ts      — logique métier partagée
supabase/migrations/0001_init.sql   — schéma + RLS
```

## Modifier les statuts de lecture

La liste des statuts (`À acheter`, `À lire`, `En cours`, `Terminé`,
`Abandonné`) se modifie à un seul endroit : `src/lib/types.ts`
(`BOOK_STATUSES` / `STATUS_LABELS`), plus l'enum Postgres `book_status`
dans la migration si vous ajoutez/retirez une valeur.
