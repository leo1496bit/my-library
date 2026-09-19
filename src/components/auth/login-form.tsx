"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="mt-1">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Se connecter
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
