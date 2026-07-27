"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { importCustomersCsv } from "@/app/actions/customers";
import { Button } from "@/components/ui/button";

const FIELDS = [
  { key: "nome", label: "Nome *", required: true },
  { key: "cognome", label: "Cognome *", required: true },
  { key: "email", label: "Email *", required: true },
  { key: "telefono", label: "Telefono *", required: true },
  { key: "dataNascita", label: "Data nascita", required: false },
  { key: "consensoMarketing", label: "Consenso marketing", required: false },
  { key: "canalePreferito", label: "Canale preferito", required: false },
  { key: "targa", label: "Targa veicolo", required: false },
  { key: "marca", label: "Marca", required: false },
  { key: "modello", label: "Modello", required: false },
  { key: "allestimento", label: "Allestimento", required: false },
  { key: "vin", label: "VIN", required: false },
  { key: "annoImmatricolazione", label: "Anno immatricolazione", required: false },
  { key: "kmAttuali", label: "Km attuali", required: false },
  { key: "dataAcquisto", label: "Data acquisto", required: false },
  { key: "fineGaranzia", label: "Fine garanzia", required: false },
  { key: "fineFinanziamento", label: "Fine finanziamento", required: false },
  { key: "prossimaRevisione", label: "Prossima revisione", required: false },
  { key: "prossimoTagliandoData", label: "Prossimo tagliando", required: false },
  { key: "prossimoTagliandoKm", label: "Tagliando km", required: false },
] as const;

const AUTO_MAP: Record<string, string[]> = {
  nome: ["nome", "name", "first_name", "firstname"],
  cognome: ["cognome", "surname", "last_name", "lastname"],
  email: ["email", "e-mail", "mail"],
  telefono: ["telefono", "tel", "phone", "cellulare", "mobile"],
  dataNascita: ["data_nascita", "datanascita", "nascita", "birthday"],
  consensoMarketing: ["consenso", "marketing", "consenso_marketing"],
  canalePreferito: ["canale", "canale_preferito", "channel"],
  targa: ["targa", "plate", "license_plate"],
  marca: ["marca", "brand", "make"],
  modello: ["modello", "model"],
  allestimento: ["allestimento", "trim", "version"],
  vin: ["vin", "telaio"],
  annoImmatricolazione: ["anno", "anno_immatricolazione", "year"],
  kmAttuali: ["km", "km_attuali", "mileage"],
  dataAcquisto: ["data_acquisto", "acquisto", "purchase_date"],
  fineGaranzia: ["fine_garanzia", "garanzia"],
  fineFinanziamento: ["fine_finanziamento", "finanziamento"],
  prossimaRevisione: ["revisione", "prossima_revisione"],
  prossimoTagliandoData: ["tagliando", "prossimo_tagliando"],
  prossimoTagliandoKm: ["tagliando_km", "prossimo_tagliando_km"],
};

export default function ImportClientiPage() {
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    imported: number;
    errors: { row: number; message: string }[];
    message?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const previewRows = useMemo(() => {
    if (!csvText) return [];
    return csvText
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(1, 4);
  }, [csvText]);

  function onFile(file: File | null) {
    setResult(null);
    setError(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsvText(text);
      const first = text.replace(/^\uFEFF/, "").split(/\r?\n/)[0] ?? "";
      const cols = first.split(/[,;]/).map((c) => c.trim().replace(/^"|"$/g, ""));
      setHeaders(cols);
      const auto: Record<string, string> = {};
      for (const field of FIELDS) {
        const aliases = AUTO_MAP[field.key] ?? [];
        const match = cols.find((c) =>
          aliases.includes(c.toLowerCase().replace(/\s+/g, "_")),
        );
        if (match) auto[field.key] = match;
      }
      setMapping(auto);
    };
    reader.readAsText(file, "UTF-8");
  }

  function runImport() {
    setError(null);
    startTransition(async () => {
      const res = await importCustomersCsv(csvText, mapping);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setResult({
        imported: res.data?.imported ?? 0,
        errors: res.data?.errors ?? [],
        message: res.message,
      });
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/clienti" className="text-sm text-accent hover:underline">
          ← Torna ai clienti
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Import CSV
        </h1>
        <p className="mt-1 text-sm text-muted">
          Canale principale di onboarding: carica clienti e veicoli, mappa le
          colonne e rivedi gli errori riga per riga.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="font-semibold">1. Carica file</h2>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        <p className="text-xs text-muted">
          Separatore virgola o punto e virgola. Codifica UTF-8 consigliata.
          Esempio intestazioni: nome,cognome,email,telefono,targa,marca,modello,anno,km
        </p>
      </section>

      {headers.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold">2. Mappa colonne</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <label key={field.key} className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">{field.label}</span>
                <select
                  className="h-10 w-full rounded-lg border border-border bg-white px-3"
                  value={mapping[field.key] ?? ""}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [field.key]: e.target.value }))
                  }
                >
                  <option value="">— ignora —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {previewRows.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Anteprima prime righe</p>
              <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                {previewRows.join("\n")}
              </pre>
            </div>
          )}

          <Button onClick={runImport} disabled={pending || !csvText}>
            {pending ? "Import in corso…" : "Avvia import"}
          </Button>
        </section>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {result && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold">3. Report</h2>
          <p className="text-sm">
            {result.message ?? `Importati ${result.imported} record.`}
          </p>
          {result.errors.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2">Riga</th>
                    <th className="px-3 py-2">Errore</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, i) => (
                    <tr key={`${err.row}-${i}`} className="border-t border-border">
                      <td className="px-3 py-2 tabular-nums">{err.row}</td>
                      <td className="px-3 py-2 text-danger">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-success">Nessun errore.</p>
          )}
          <Link href="/clienti">
            <Button variant="secondary">Vai all&apos;anagrafica</Button>
          </Link>
        </section>
      )}
    </div>
  );
}
