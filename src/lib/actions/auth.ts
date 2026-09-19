"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error?: string;
  message?: string;
}

function friendlyAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (message.includes("User already registered")) {
    return "Un compte existe déjà avec cet e-mail.";
  }
  if (message.includes("Password should be at least")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  return message;
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/library");

  if (!email || !password) {
    return { error: "Renseignez votre e-mail et votre mot de passe." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  redirect(next.startsWith("/") ? next : "/library");
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !password) {
    return { error: "Renseignez votre e-mail et votre mot de passe." };
  }
  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }
  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  if (data.session) {
    redirect("/library");
  }

  return {
    message:
      "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.",
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
