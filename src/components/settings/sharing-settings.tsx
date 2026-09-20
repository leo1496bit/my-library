"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/lib/types";

function generateSlug() {
  // 12 caractères hex (48 bits) : assez pour un lien "non listé", pas
  // destiné à résister à une attaque ciblée — cohérent avec l'usage
  // (partage volontaire d'un lien, pas un contrôle d'accès fort).
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export function SharingSettings() {
  const [profile, setProfile] = useState<Profile | null | "loading">("loading");
  const [displayName, setDisplayName] = useState("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  // Lecture unique d'un global navigateur : initialiseur paresseux plutôt
  // qu'un effet, cette valeur n'est de toute façon rendue qu'après le
  // chargement du profil (aucun risque de désync serveur/client).
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, display_name, sharing_enabled, share_slug")
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data ?? null);
        setDisplayName(data?.display_name ?? "");
      });
  }, []);

  async function handleToggle(nextEnabled: boolean) {
    setPending(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPending(false);
      return;
    }

    const payload = {
      id: user.id,
      sharing_enabled: nextEnabled,
      display_name: displayName || null,
      // Génère un lien à la première activation ; les activations
      // suivantes réutilisent le même lien tant qu'il n'est pas régénéré.
      ...(nextEnabled && !getShareSlug(profile) ? { share_slug: generateSlug() } : {}),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("id, display_name, sharing_enabled, share_slug")
      .single();

    setPending(false);
    if (error || !data) {
      toast.error("Impossible de mettre à jour le partage.");
      return;
    }
    setProfile(data);
    toast.success(nextEnabled ? "Bibliothèque partagée activée." : "Partage désactivé.");
  }

  async function handleRegenerate() {
    if (profile === "loading" || !profile) return;
    setPending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ share_slug: generateSlug() })
      .eq("id", profile.id)
      .select("id, display_name, sharing_enabled, share_slug")
      .single();
    setPending(false);
    if (error || !data) {
      toast.error("Impossible de régénérer le lien.");
      return;
    }
    setProfile(data);
    toast.success("Nouveau lien généré — l'ancien ne fonctionne plus.");
  }

  async function handleSaveName() {
    if (profile === "loading" || !profile) return;
    if (displayName === (profile.display_name ?? "")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName || null })
      .eq("id", profile.id);
    if (error) {
      toast.error("Le nom n'a pas pu être enregistré.");
      return;
    }
    setProfile({ ...profile, display_name: displayName || null });
  }

  function shareUrl(slug: string) {
    return `${origin}/u/${slug}`;
  }

  async function handleCopy(slug: string) {
    try {
      await navigator.clipboard.writeText(shareUrl(slug));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible — sélectionnez et copiez le lien manuellement.");
    }
  }

  if (profile === "loading") {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  const enabled = profile?.sharing_enabled ?? false;
  const slug = profile?.share_slug ?? null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">Bibliothèque publique</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Visible sans compte, en lecture seule — un visiteur connecté à son propre compte peut
            suggérer un livre vers sa bibliothèque, jamais modifier la vôtre.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={pending} />
      </div>

      {enabled && slug && (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="share-link">Lien à partager</Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                readOnly
                value={shareUrl(slug)}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCopy(slug)}
                aria-label="Copier le lien"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                render={
                  <a
                    href={shareUrl(slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ouvrir le lien"
                  />
                }
              >
                <ExternalLink className="size-4" />
              </Button>
            </div>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={pending}
              className="mt-1 flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="size-3" />
              Régénérer le lien (l&apos;ancien cessera de fonctionner)
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="display-name">Nom affiché publiquement</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={handleSaveName}
              placeholder="Bibliothèque de…"
              maxLength={60}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function getShareSlug(profile: Profile | null | "loading") {
  if (profile === "loading" || !profile) return null;
  return profile.share_slug;
}
