-- Objectif de lecture en pages, à côté de l'objectif en nombre de livres
-- (`target_books`, 0001_init.sql). Nullable : contrairement à
-- `target_books`, c'est un second objectif facultatif — l'utilisateur peut
-- choisir de ne suivre que l'un des deux, ou les deux à la fois.

alter table public.reading_goals
  add column if not exists target_pages integer check (target_pages is null or target_pages > 0);

-- `reading_goals_select_own`/`_update_own` (0001_init.sql) filtrent par ligne
-- (`user_id = auth.uid()`) sans liste de colonnes explicite : la nouvelle
-- colonne est donc déjà couverte, aucune policy à modifier. Reading Goal
-- reste privé (CONTEXT.md, section Reading Goal) : aucune fonction publique
-- ne l'expose, donc rien à refaire côté partage.
