# Domain glossary — Ma bibliothèque

A personal library manager: track books, loans, and reading habits; optionally
publish a read-only view of the library. This file names the concepts so
architecture discussions (and `/improve-codebase-architecture` reviews) can
refer to them consistently instead of drifting into implementation names.

## Core concepts

- **Book** — a single entry in a user's library. Has bibliographic fields
  (title, author, genre, ISBN, cover, publisher, year, language, page count),
  a reading **Status**, an optional **Rating** (1–5), free-text **Notes**, a
  physical **Location**, and a **Format** (physical/digital/audio).
- **Status** — where a Book sits in the reading lifecycle: `to_buy`,
  `to_read`, `reading`, `finished`, `abandoned`. Transitioning a Book into
  `reading` or `finished` stamps `date_started`/`date_finished` automatically
  (a database trigger, not application code — see
  `supabase/migrations/0001_init.sql`).
- **Quick Add** — the primary way a Book enters the library: search Google
  Books by title, pick a result, confirm a Status via chips. Optimized for
  minimum taps; all non-essential fields (notes, tags, location) are filled
  in later from the Book's own page.
- **Loan** — an independent record of lending a Book to a **Borrower**
  (a plain name, not a user account). A Book's Status and its Loan state are
  orthogonal: a `finished` Book can still be on loan.
- **Tag** — a free-form label a user attaches to Books (e.g. "Philosophie").
  Many-to-many via the `book_tags` join. Used to filter the library, on top
  of the auto-detected Genre.
- **Reading Goal** — a per-year target number of Books to finish, shown
  against the count of Books actually finished that year. Personal, never
  exposed on a Shared Library.

## Sharing

- **Profile** — one row per user, created lazily the first time they turn on
  sharing. Holds `display_name`, `sharing_enabled`, and `share_slug` (the
  public link's token).
- **Shared Library** — the read-only, no-account-required view of a user's
  Books at `/u/[slug]`, gated entirely by `profiles.sharing_enabled`. Shows
  Books, Statuses, Ratings, and Tags — never Notes, Location, or Loan/Borrower
  details (private by construction, see
  `supabase/migrations/0004_fix_public_sharing_column_leak.sql` for why this
  is enforced at the database layer, not just hidden in the UI).
- **Suggestion** — the one write action a Shared Library visitor can take:
  while signed into their _own_ account, add a viewed Book into their _own_
  library (`to_buy` or `to_read`). Never modifies the library being viewed.

## External integration

- **Google Books lookup** — the only source of auto-filled bibliographic data,
  used by Quick Add, CSV Import (to backfill missing fields), and
  Recommendations. French editions are preferred (`langRestrict=fr`) with a
  fallback to the original language when no French edition is indexed.
- **Recommendations** — Books suggested from Google Books based on the
  user's most frequent/highest-rated Authors and Genres already in their
  library, excluding Books they already own.

## Known architectural note

There is currently no dedicated data-access module: pages/components call
the Supabase client directly. See the architecture review this file was
introduced alongside for the first deepening pass on this.
