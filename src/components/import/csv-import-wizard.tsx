"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusSelectChips } from "@/components/books/status-select-chips";
import { createClient } from "@/lib/supabase/client";
import {
  IMPORT_FIELDS,
  isDuplicate,
  mapCsvRow,
  normalizeKey,
  type ColumnMapping,
  type ImportedBookRow,
} from "@/lib/csv";
import type { BookStatus } from "@/lib/types";

type Step = "upload" | "map" | "preview" | "done";

const NONE = "__none__";

export function CsvImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [defaultStatus, setDefaultStatus] = useState<BookStatus>("to_read");
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [dedupeFlags, setDedupeFlags] = useState<boolean[]>([]);

  function handleFile(file: File) {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields ?? [];
        setHeaders(cols);
        setRows(results.data);

        // Pré-remplissage naïf : associe les colonnes dont le nom ressemble
        // au champ de l'app.
        const guessed: ColumnMapping = {};
        for (const field of IMPORT_FIELDS) {
          const match = cols.find((c) => normalizeKey(c).includes(field.key.replace("_", "")) || normalizeKey(c) === normalizeKey(field.label));
          if (match) guessed[field.key] = match;
        }
        setMapping(guessed);
        setStep("map");
      },
      error: () => {
        toast.error("Impossible de lire ce fichier CSV.");
      },
    });
  }

  const mappedRows = useMemo(() => {
    return rows
      .map((r) => mapCsvRow(r, mapping, { status: defaultStatus, format: "physical" }))
      .filter((r): r is ImportedBookRow => r !== null);
  }, [rows, mapping, defaultStatus]);

  async function goToPreview() {
    if (!mapping.title) {
      toast.error("Associez au moins la colonne du titre.");
      return;
    }

    const supabase = createClient();
    const { data: existing } = await supabase.from("books").select("title, author, isbn");
    const isbnSet = new Set((existing ?? []).map((b) => normalizeKey(b.isbn)).filter(Boolean));
    const titleAuthorSet = new Set(
      (existing ?? []).map((b) => `${normalizeKey(b.title)}::${normalizeKey(b.author)}`),
    );

    const flags = mappedRows.map((r) => isDuplicate(r, { isbnSet, titleAuthorSet }));
    setDedupeFlags(flags);
    setIncluded(new Set(mappedRows.map((_, i) => i).filter((i) => !flags[i])));
    setStep("preview");
  }

  function toggleRow(index: number) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleImport() {
    const toInsert = mappedRows.filter((_, i) => included.has(i));
    if (!toInsert.length) {
      toast.error("Aucune ligne sélectionnée.");
      return;
    }
    setImporting(true);
    const supabase = createClient();
    const { error } = await supabase.from("books").insert(toInsert);
    setImporting(false);

    if (error) {
      toast.error("L'import a échoué. Réessayez.");
      return;
    }

    setImportedCount(toInsert.length);
    setStep("done");
  }

  if (step === "upload") {
    return (
      <div className="flex flex-col gap-4 px-4 pt-4">
        <Header title="Importer un CSV" subtitle="Ajoutez plusieurs livres d'un coup depuis un fichier CSV." />
        <label
          htmlFor="csv-file"
          className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border bg-card px-4 py-12 text-center hover:border-primary/40"
        >
          <Upload className="size-7 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-sm text-foreground">Choisir un fichier CSV</span>
          <span className="text-xs text-muted-foreground">
            Première ligne = en-têtes de colonnes
          </span>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
        <Header title="Associer les colonnes" subtitle={`${fileName} · ${rows.length} lignes détectées`} />
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
          {IMPORT_FIELDS.map((field) => (
            <div key={field.key} className="flex items-center justify-between gap-3">
              <Label className="text-sm">
                {field.label}
                {field.required && <span className="text-loan"> *</span>}
              </Label>
              <Select
                value={mapping[field.key] ?? NONE}
                onValueChange={(v) =>
                  setMapping((prev) => ({ ...prev, [field.key]: v === NONE ? undefined : v }))
                }
              >
                <SelectTrigger size="sm" className="w-44">
                  <SelectValue placeholder="Aucune colonne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Aucune colonne</SelectItem>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Statut par défaut pour ces livres</Label>
          <StatusSelectChips value={defaultStatus} onChange={setDefaultStatus} />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setStep("upload")}>
            Retour
          </Button>
          <Button className="flex-1" onClick={goToPreview}>
            Aperçu ({mappedRows.length} livres)
          </Button>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    const duplicateCount = dedupeFlags.filter(Boolean).length;
    return (
      <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
        <Header
          title="Aperçu de l'import"
          subtitle={`${included.size} livre(s) sélectionné(s) sur ${mappedRows.length}${
            duplicateCount ? ` · ${duplicateCount} doublon(s) détecté(s)` : ""
          }`}
        />
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
          {mappedRows.map((row, i) => (
            <label key={i} className="flex items-start gap-3 px-3 py-2.5">
              <Checkbox
                checked={included.has(i)}
                onCheckedChange={() => toggleRow(i)}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">{row.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {row.author ?? "Auteur inconnu"}
                </span>
                {dedupeFlags[i] && (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-loan">
                    <AlertTriangle className="size-3" /> Doublon probable dans votre bibliothèque
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setStep("map")}>
            Retour
          </Button>
          <Button className="flex-1" onClick={handleImport} disabled={importing}>
            {importing && <Loader2 className="size-4 animate-spin" />}
            Importer {included.size} livre{included.size > 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 px-4 pt-16 text-center">
      <CheckCircle2 className="size-10 text-success" strokeWidth={1.5} />
      <div>
        <h1 className="font-heading text-xl text-foreground">Import terminé</h1>
        <p className="text-sm text-muted-foreground">
          {importedCount} livre{importedCount > 1 ? "s" : ""} ajouté{importedCount > 1 ? "s" : ""} à votre
          bibliothèque.
        </p>
      </div>
      <Button onClick={() => router.push("/library")}>Voir ma bibliothèque</Button>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="font-heading text-2xl text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
