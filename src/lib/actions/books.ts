"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Book, BookStatus } from "@/lib/types";

const QUICK_ADD_STATUSES: BookStatus[] = ["to_buy", "to_read", "reading"];

const newBookSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire."),
  author: z.string().trim().optional().nullable(),
  genre: z.string().trim().optional().nullable(),
  isbn: z.string().trim().optional().nullable(),
  cover_url: z.string().trim().optional().nullable(),
  publisher: z.string().trim().optional().nullable(),
  published_year: z.coerce.number().int().optional().nullable(),
  language: z.string().trim().optional().nullable(),
  page_count: z.coerce.number().int().min(0).optional().nullable(),
  format: z.enum(["physical", "digital", "audio"]).default("physical"),
  status: z.enum(["to_buy", "to_read", "reading"]).default("to_read"),
  google_books_id: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
});

export type NewBookInput = z.infer<typeof newBookSchema>;

export interface BookActionState {
  error?: string;
  book?: Book;
}

export async function addBookAction(
  input: NewBookInput,
): Promise<BookActionState> {
  const parsed = newBookSchema.safeParse(input);
  if (!parsed.success) {
    const titleError = parsed.error.flatten().fieldErrors.title?.[0];
    return { error: titleError ?? "Champs invalides." };
  }

  const data = parsed.data;
  if (!QUICK_ADD_STATUSES.includes(data.status)) {
    data.status = "to_read";
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée, reconnectez-vous." };
  }

  const { data: book, error } = await supabase
    .from("books")
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error("addBookAction failed", error);
    return { error: "Impossible d'ajouter ce livre. Réessayez." };
  }

  revalidatePath("/library");
  revalidatePath("/stats");
  return { book: book as Book };
}

export async function deleteBookAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) {
    console.error("deleteBookAction failed", error);
    return { error: "Suppression impossible." };
  }
  revalidatePath("/library");
  return {};
}
