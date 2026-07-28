"use client";

import { useActionState, useState } from "react";
import { createFunnel } from "@/app/actions/funnels";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  FUNNEL_CHANNELS,
  FUNNEL_CHANNEL_LABELS,
  FUNNEL_STEP_KINDS,
  FUNNEL_STEP_KIND_LABELS,
  FUNNEL_TRIGGERS,
  FUNNEL_TRIGGER_LABELS,
} from "@/lib/funnel-labels";
import type { ActionResult } from "@/lib/validation/schemas";
import type { FunnelChannel, FunnelStepKind } from "@prisma/client";

type DraftStep = {
  timingLabel: string;
  giornoOffset: number;
  canale: FunnelChannel;
  tipo: FunnelStepKind;
  oggetto: string;
  corpo: string;
  offerta: string;
  condizione: string;
};

const emptyStep = (): DraftStep => ({
  timingLabel: "Giorno 0",
  giornoOffset: 0,
  canale: "WHATSAPP",
  tipo: "MESSAGGIO",
  oggetto: "",
  corpo: "",
  offerta: "",
  condizione: "",
});

export function FunnelBuilderForm() {
  const [steps, setSteps] = useState<DraftStep[]>([emptyStep()]);
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(createFunnel, null);

  function updateStep(index: number, patch: Partial<DraftStep>) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="stepsJson" value={JSON.stringify(steps)} />

      <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Impostazioni funnel</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome" name="nome" required placeholder="Es. Riattivazione dormienti" />
          <Select
            label="Trigger"
            name="triggerTipo"
            defaultValue="DORMIENTE_OFFICINA"
            options={FUNNEL_TRIGGERS.map((t) => ({
              value: t,
              label: FUNNEL_TRIGGER_LABELS[t],
            }))}
          />
        </div>
        <Textarea
          label="Descrizione"
          name="descrizione"
          required
          rows={2}
          placeholder="Cosa fa questo funnel in una frase"
        />
        <Textarea
          label="Dettaglio trigger"
          name="triggerNota"
          required
          rows={2}
          placeholder="Quando entra un cliente in questo funnel"
        />
        <Textarea
          label="Meccanica"
          name="meccanica"
          required
          rows={2}
          placeholder="Urgenza, scarsità, lead magnet…"
        />
        <Textarea
          label="KPI target"
          name="kpiTarget"
          required
          rows={2}
          placeholder="Es. tasso riattivazione 8–15%"
        />
        <Textarea
          label="Nota compliance (opzionale)"
          name="notaCompliance"
          rows={2}
          placeholder="Es. DPR 430/2001 per concorsi a premi"
        />
        <Select
          label="Stato iniziale"
          name="stato"
          defaultValue="BOZZA"
          options={[
            { value: "BOZZA", label: "Bozza" },
            { value: "ATTIVO", label: "Attivo" },
            { value: "IN_PAUSA", label: "In pausa" },
          ]}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Step multicanale</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setSteps((s) => [...s, emptyStep()])}
          >
            Aggiungi step
          </Button>
        </div>

        {steps.map((step, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Step {index + 1}</p>
              {steps.length > 1 && (
                <button
                  type="button"
                  className="text-sm text-danger"
                  onClick={() =>
                    setSteps((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Rimuovi
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Timing label</span>
                <input
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                  value={step.timingLabel}
                  onChange={(e) =>
                    updateStep(index, { timingLabel: e.target.value })
                  }
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">
                  Offset giorni
                </span>
                <input
                  type="number"
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                  value={step.giornoOffset}
                  onChange={(e) =>
                    updateStep(index, {
                      giornoOffset: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Canale</span>
                <select
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                  value={step.canale}
                  onChange={(e) =>
                    updateStep(index, {
                      canale: e.target.value as FunnelChannel,
                    })
                  }
                >
                  {FUNNEL_CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {FUNNEL_CHANNEL_LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Tipo</span>
                <select
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                  value={step.tipo}
                  onChange={(e) =>
                    updateStep(index, {
                      tipo: e.target.value as FunnelStepKind,
                    })
                  }
                >
                  {FUNNEL_STEP_KINDS.map((t) => (
                    <option key={t} value={t}>
                      {FUNNEL_STEP_KIND_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">Oggetto</span>
              <input
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                value={step.oggetto}
                onChange={(e) => updateStep(index, { oggetto: e.target.value })}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">Corpo messaggio</span>
              <textarea
                className="min-h-24 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                value={step.corpo}
                onChange={(e) => updateStep(index, { corpo: e.target.value })}
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Offerta</span>
                <input
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                  value={step.offerta}
                  onChange={(e) =>
                    updateStep(index, { offerta: e.target.value })
                  }
                  placeholder="Es. Tagliando -20% entro il 15/09"
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Condizione</span>
                <input
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                  value={step.condizione}
                  onChange={(e) =>
                    updateStep(index, { condizione: e.target.value })
                  }
                  placeholder="Es. Solo se non ha risposto"
                />
              </label>
            </div>
          </div>
        ))}
      </section>

      {state && !state.success && (
        <p className="text-sm text-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Salvataggio…" : "Crea funnel"}
      </Button>
    </form>
  );
}
