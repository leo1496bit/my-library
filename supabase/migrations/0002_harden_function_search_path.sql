-- Corrige l'avertissement de sécurité "Function Search Path Mutable" du
-- linter Supabase : fige le search_path des fonctions trigger.
alter function public.set_updated_at() set search_path = '';
alter function public.handle_book_status_change() set search_path = '';
