"use client";

import { useEffect, useRef, useState } from "react";

// Compte de 0 à la valeur réelle une fois visible à l'écran — le seul
// moment animé déclenché par le défilement plutôt qu'en boucle, réservé à
// ce chiffre précis pour rester un geste ponctuel plutôt qu'un effet
// répété sur chaque section.
export function LandingCountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);
  const [display, setDisplay] = useState(0);
  // Calculé pendant le rendu plutôt que dans un effet (jamais lu côté
  // serveur, réévalué correctement à l'hydratation) : évite un setState
  // synchrone dans l'effet pour le cas "mouvement réduit".
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || startedRef.current) return;
        startedRef.current = true;

        const duration = 1100;
        const start = performance.now();

        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, prefersReducedMotion]);

  return (
    <span ref={ref} className={className}>
      {(prefersReducedMotion ? value : display).toLocaleString("fr-FR")}
    </span>
  );
}
