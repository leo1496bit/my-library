import Link from "next/link";
import { BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/books/status-badge";
import { LoanBadge } from "@/components/books/loan-badge";
import { BarList } from "@/components/stats/bar-list";
import { LandingDemoCard } from "@/components/landing/landing-demo-card";
import { LandingAutofillDemo } from "@/components/landing/landing-autofill-demo";
import { LandingCountUp } from "@/components/landing/landing-count-up";
import type { ReactNode } from "react";

const FEATURES: { title: string; body: string }[] = [
  {
    title: "Ajout instantané",
    body: "Un titre suffit : couverture, auteur, éditeur, ISBN se remplissent seuls, via Google Books.",
  },
  {
    title: "Statuts de lecture",
    body: "À acheter, à lire, en cours, terminé, abandonné — chaque livre a sa place exacte.",
  },
  {
    title: "Suivi des prêts",
    body: "Qui a quoi, depuis quand, et quand ça doit revenir.",
  },
  {
    title: "Tags intelligents",
    body: "Vos catégories habituelles se suggèrent seules à chaque nouvel ajout.",
  },
  {
    title: "Statistiques",
    body: "Rythme de lecture, genres, auteurs préférés — en un regard.",
  },
  {
    title: "Import CSV",
    body: "Toute une collection existante basculée en quelques minutes.",
  },
  {
    title: "Bibliothèque partagée",
    body: "Un lien public, en lecture seule, pour la montrer sans donner les clés.",
  },
];

const GENRES = [
  { key: "essai", label: "Essai", count: 14 },
  { key: "roman", label: "Roman", count: 9 },
  { key: "histoire", label: "Histoire", count: 6 },
  { key: "sf", label: "Science-fiction", count: 4 },
];

export function LandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
              <BookMarked className="size-4" strokeWidth={1.75} />
            </span>
            <span className="font-heading text-lg text-foreground italic">Ma bibliothèque</span>
          </Link>
          {isAuthenticated ? (
            <Button nativeButton={false} render={<Link href="/library" />}>
              Aller à ma bibliothèque
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/login" />}
                className="hidden sm:inline-flex"
              >
                Se connecter
              </Button>
              <Button nativeButton={false} render={<Link href="/signup" />}>
                Créer un compte
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* HERO — la démo qui boucle (LandingDemoCard) est le seul élément
            animé en continu de la page ; le reste répond au défilement ou
            au pointeur, jamais à un minutage arbitraire. */}
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pt-10 pb-14 sm:pt-16 sm:pb-20 lg:flex-row lg:items-center lg:gap-16 lg:py-24">
          <div className="flex flex-col gap-6 sm:gap-7 lg:w-[54%]">
            <h1 className="text-balance font-heading text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-[56px] lg:leading-[1.06]">
              La bibliothèque que <span className="italic">vous n&apos;avez jamais perdue.</span>
            </h1>
            <p className="max-w-[46ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
              Vos livres, vos prêts, vos lectures : réunis en un seul endroit.
            </p>
            <div className="flex flex-col items-start gap-4 pt-1 sm:flex-row sm:items-center sm:gap-6">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  className="h-11 px-6 text-base"
                  nativeButton={false}
                  render={<Link href="/library" />}
                >
                  Aller à ma bibliothèque
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="h-11 px-6 text-base"
                    nativeButton={false}
                    render={<Link href="/signup" />}
                  >
                    Créer un compte gratuitement
                  </Button>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-center lg:w-[46%] lg:justify-end">
            <LandingDemoCard />
          </div>
        </section>

        {/* FONCTIONNALITÉS */}
        <section className="border-t border-border/60 px-4 py-14 sm:py-20">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="mb-8 max-w-[28ch] font-heading text-2xl text-foreground italic sm:text-3xl">
              Sept idées simples pour ne plus jamais perdre le fil.
            </h2>
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:gap-4 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="flex w-[15rem] shrink-0 snap-start flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md sm:w-auto"
                >
                  <p className="font-heading text-base text-foreground">{feature.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Un titre suffit — l'auto-remplissage, mis en avant en premier */}
        <DeepDive
          heading="Un titre suffit."
          body="Tapez le nom d'un livre, choisissez la bonne édition : couverture, auteur, éditeur, année, pages et ISBN se remplissent tout seuls, via Google Books."
        >
          <LandingAutofillDemo />
        </DeepDive>

        {/* Suivi des prêts */}
        <DeepDive
          heading="Chaque prêt sous contrôle."
          body="Notez à qui vous prêtez un livre : sachez toujours ce qui est sorti, depuis quand, et quand ça doit revenir."
          tinted
        >
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-base text-foreground">Le Nom de la rose</p>
                <p className="text-sm text-muted-foreground">Umberto Eco</p>
              </div>
              <LoanBadge />
            </div>
            <p className="text-xs text-muted-foreground">
              Prêté à Nora depuis le 3 mars — retour prévu le 24 mars
            </p>
          </div>
        </DeepDive>

        {/* Statistiques — section contrastée */}
        <DeepDive
          heading="Vos habitudes, en un regard."
          body="Combien de livres terminés ce mois-ci, quels genres dominent votre étagère, sans tenir de tableau vous-même."
          reverse
        >
          <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div>
              <LandingCountUp
                value={8359}
                className="font-heading text-3xl text-foreground tabular-nums"
              />
              <p className="text-sm text-muted-foreground">pages lues cette année</p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium text-foreground">Genres les plus lus</p>
              <BarList entries={GENRES} />
            </div>
          </div>
        </DeepDive>

        {/* Partage public */}
        <DeepDive
          heading="Sans donner les clés."
          body="Un lien public, en lecture seule, que n'importe qui peut consulter sans créer de compte. Un visiteur connecté peut même vous suggérer un livre."
          tinted
        >
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <span className="font-heading text-base text-foreground italic">
                Bibliothèque de Camille
              </span>
              <span className="text-[11px] font-medium text-primary">Lecture seule</span>
            </div>
            {[
              { title: "Sapiens", status: "to_read" as const },
              { title: "L'Étranger", status: "finished" as const },
              { title: "Le Nom de la rose", status: "reading" as const },
            ].map((book) => (
              <div key={book.title} className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground">{book.title}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={book.status} />
                  <span className="text-xs font-medium text-accent">Suggérer</span>
                </div>
              </div>
            ))}
          </div>
        </DeepDive>

        {/* CTA final */}
        <section className="border-t border-border/60 bg-primary px-6 py-20 text-center sm:py-28">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5">
            <h2 className="font-heading text-3xl text-primary-foreground italic sm:text-4xl">
              Votre bibliothèque vous attend.
            </h2>
            <p className="max-w-[40ch] text-sm text-primary-foreground/80 sm:text-base">
              {isAuthenticated
                ? "Retrouvez vos livres, vos prêts et vos statistiques."
                : "Gratuit, sans carte bancaire : le temps de créer un compte, votre premier livre est déjà cherchable."}
            </p>
            <Button
              size="lg"
              className="h-11 bg-background px-6 text-base text-primary hover:bg-background/90"
              nativeButton={false}
              render={<Link href={isAuthenticated ? "/library" : "/signup"} />}
            >
              {isAuthenticated ? "Aller à ma bibliothèque" : "Créer un compte gratuitement"}
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <span className="flex items-center gap-2 text-foreground">
            <BookMarked className="size-4" strokeWidth={1.75} />
            Ma bibliothèque
          </span>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/library" className="hover:text-foreground">
                Ma bibliothèque
              </Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-foreground">
                  Connexion
                </Link>
                <Link href="/signup" className="hover:text-foreground">
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function DeepDive({
  heading,
  body,
  children,
  tinted = false,
  reverse = false,
}: {
  heading: string;
  body: string;
  children: ReactNode;
  tinted?: boolean;
  reverse?: boolean;
}) {
  return (
    <section
      className={`border-t border-border/60 px-4 py-14 sm:py-20 ${tinted ? "bg-secondary/40" : ""}`}
    >
      <div
        className={`mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-20 ${
          reverse ? "lg:flex-row-reverse" : ""
        }`}
      >
        <div className="flex flex-col gap-3 lg:max-w-[380px]">
          <h3 className="font-heading text-2xl text-foreground italic sm:text-[28px]">{heading}</h3>
          <p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">{body}</p>
        </div>
        <div className="w-full max-w-sm lg:w-[420px] lg:max-w-none lg:shrink-0">{children}</div>
      </div>
    </section>
  );
}
