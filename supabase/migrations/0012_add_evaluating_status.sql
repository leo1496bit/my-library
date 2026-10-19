-- Ajoute le statut "evaluating" ("Sur la liste" côté UI) à l'enum
-- book_status, pour les livres en réflexion avant achat (voir CONTEXT.md).
-- Positionné juste avant 'to_buy', parallèle à lui dans le cycle de vie
-- (pas une étape imposée — le sélecteur de statut existant permet de passer
-- librement de n'importe quel statut à n'importe quel autre, comme
-- aujourd'hui).
--
-- Contrainte Postgres : une valeur ajoutée via `ALTER TYPE ... ADD VALUE` ne
-- peut pas être utilisée (comparée, insérée) dans la même transaction/le
-- même fichier de migration que celui qui l'ajoute ("unsafe use of new value
-- ... before the ALTER TYPE has been committed"). Ce fichier ne fait donc
-- STRICTEMENT rien d'autre qu'ajouter la valeur — tout le reste (exclusion
-- du partage public, table book_opinions) vit dans la migration suivante
-- (0013), qui peut en toute sécurité utiliser 'evaluating'.

do $$ begin
  alter type book_status add value 'evaluating' before 'to_buy';
exception when duplicate_object then null; end $$;
