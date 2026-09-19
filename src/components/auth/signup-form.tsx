"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  if (state.message) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-5 py-8 text-center">
        <MailCheck className="size-6 text-success" strokeWidth={1.75} />
        <p className="text-sm text-foreground">{state.message}</p>
        <Link href="/login" className="text-sm font-medium underline underline-offset-4">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vous@exemple.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </div>
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="mt-1">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Créer mon compte
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
