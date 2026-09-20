"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tag } from "@/lib/types";

export function TagEditor({
  bookId,
  tags,
  onChange,
}: {
  bookId: string;
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);

  async function addTag() {
    const name = draft.trim();
    if (!name || pending) return;
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }

    setPending(true);
    const supabase = createClient();

    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .upsert({ name }, { onConflict: "user_id,name" })
      .select()
      .single();

    if (tagError || !tag) {
      setPending(false);
      return;
    }

    const { error: linkError } = await supabase
      .from("book_tags")
      .upsert({ book_id: bookId, tag_id: tag.id }, { onConflict: "book_id,tag_id" });

    setPending(false);
    if (linkError) return;

    setDraft("");
    onChange([...tags, tag as Tag]);
  }

  async function removeTag(tag: Tag) {
    onChange(tags.filter((t) => t.id !== tag.id));
    const supabase = createClient();
    await supabase.from("book_tags").delete().eq("book_id", bookId).eq("tag_id", tag.id);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
        >
          {tag.name}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Retirer le tag ${tag.name}`}
            className="text-secondary-foreground/60 hover:text-secondary-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Ajouter un tag"
          className="w-24 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={addTag}
          aria-label="Ajouter"
          className="text-muted-foreground"
        >
          <Plus className="size-3" />
        </button>
      </span>
    </div>
  );
}
