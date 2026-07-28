"use client";

import { useActionState, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  Gift,
  GripVertical,
  Mail,
  MessageCircle,
  Phone,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";
import { createFunnel } from "@/app/actions/funnels";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  FUNNEL_CHANNEL_LABELS,
  FUNNEL_STEP_KIND_LABELS,
  FUNNEL_TRIGGERS,
  FUNNEL_TRIGGER_LABELS,
} from "@/lib/funnel-labels";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/validation/schemas";
import type { FunnelChannel, FunnelStepKind } from "@prisma/client";

type DraftStep = {
  id: string;
  timingLabel: string;
  giornoOffset: number;
  canale: FunnelChannel;
  tipo: FunnelStepKind;
  oggetto: string;
  corpo: string;
  offerta: string;
  condizione: string;
};

type PaletteDrag =
  | { kind: "channel"; canale: FunnelChannel }
  | { kind: "mechanic"; tipo: FunnelStepKind };

const CHANNELS: {
  canale: FunnelChannel;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    canale: "WHATSAPP",
    label: "WhatsApp",
    hint: "Soft touch, conversazione",
    icon: <MessageCircle className="h-4 w-4" />,
  },
  {
    canale: "EMAIL",
    label: "Email",
    hint: "Offerte, seeding, storytelling",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    canale: "SMS",
    label: "SMS",
    hint: "Last chance, urgenza",
    icon: <Smartphone className="h-4 w-4" />,
  },
  {
    canale: "EVENTO",
    label: "Evento",
    hint: "Porte aperte, status",
    icon: <CalendarDays className="h-4 w-4" />,
  },
  {
    canale: "CHIAMATA_STAFF",
    label: "Chiamata staff",
    hint: "Handoff umano",
    icon: <Phone className="h-4 w-4" />,
  },
];

const MECHANICS: {
  tipo: FunnelStepKind;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    tipo: "MESSAGGIO",
    label: "Messaggio soft",
    hint: "Nessuna pressione commerciale",
    icon: <MessageCircle className="h-4 w-4" />,
  },
  {
    tipo: "OFFERTA",
    label: "Offerta a tempo",
    hint: "Sconto, supervalutazione, slot",
    icon: <Gift className="h-4 w-4" />,
  },
  {
    tipo: "EVENTO",
    label: "Evento / invito",
    hint: "Leva di status e scarsità",
    icon: <CalendarDays className="h-4 w-4" />,
  },
  {
    tipo: "HANDOFF_STAFF",
    label: "Passaggio staff",
    hint: "Lista chiamate con contesto",
    icon: <UserRound className="h-4 w-4" />,
  },
];

function newId() {
  return `step-${Math.random().toString(36).slice(2, 10)}`;
}

function createStep(
  canale: FunnelChannel,
  tipo: FunnelStepKind,
  order: number,
): DraftStep {
  const channelLabel = FUNNEL_CHANNEL_LABELS[canale];
  const tipoLabel = FUNNEL_STEP_KIND_LABELS[tipo];
  return {
    id: newId(),
    timingLabel: order === 0 ? "Giorno 0" : `Giorno ${order * 7}`,
    giornoOffset: order * 7,
    canale,
    tipo,
    oggetto: `${tipoLabel} · ${channelLabel}`,
    corpo: "",
    offerta: "",
    condizione: "",
  };
}

export function FunnelBuilderForm() {
  const [steps, setSteps] = useState<DraftStep[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<FunnelChannel | null>(
    "WHATSAPP",
  );
  const [selectedMechanic, setSelectedMechanic] =
    useState<FunnelStepKind | null>("MESSAGGIO");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(createFunnel, null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const payloadSteps = useMemo(
    () =>
      steps.map(({ timingLabel, giornoOffset, canale, tipo, oggetto, corpo, offerta, condizione }) => ({
        timingLabel,
        giornoOffset,
        canale,
        tipo,
        oggetto,
        corpo,
        offerta,
        condizione,
      })),
    [steps],
  );

  function addComposedStep() {
    if (!selectedChannel || !selectedMechanic) return;
    const step = createStep(selectedChannel, selectedMechanic, steps.length);
    setSteps((prev) => [...prev, step]);
    setExpandedId(step.id);
  }

  function updateStep(id: string, patch: Partial<DraftStep>) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as
      | { source: "palette"; payload: PaletteDrag }
      | { source: "step" }
      | undefined;

    // Reorder existing steps
    if (activeData?.source === "step" && String(active.id).startsWith("step-")) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const overId = String(over.id).replace("drop-", "");
      const newIndex = steps.findIndex((s) => s.id === overId || s.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        setSteps((prev) => arrayMove(prev, oldIndex, newIndex));
      }
      return;
    }

    // Drop palette item onto canvas
    if (activeData?.source === "palette") {
      const payload = activeData.payload;
      const overId = String(over.id);

      // Dropped on a specific step → update that step's channel or mechanic
      const targetStepId = overId.startsWith("drop-")
        ? overId.slice(5)
        : steps.find((s) => s.id === overId)?.id;

      if (targetStepId && steps.some((s) => s.id === targetStepId)) {
        if (payload.kind === "channel") {
          updateStep(targetStepId, { canale: payload.canale });
          setSelectedChannel(payload.canale);
        } else {
          updateStep(targetStepId, { tipo: payload.tipo });
          setSelectedMechanic(payload.tipo);
        }
        setExpandedId(targetStepId);
        return;
      }

      // Dropped on canvas → create new step composing selection
      if (overId === "funnel-canvas") {
        const canale =
          payload.kind === "channel"
            ? payload.canale
            : selectedChannel ?? "EMAIL";
        const tipo =
          payload.kind === "mechanic"
            ? payload.tipo
            : selectedMechanic ?? "MESSAGGIO";
        if (payload.kind === "channel") setSelectedChannel(payload.canale);
        if (payload.kind === "mechanic") setSelectedMechanic(payload.tipo);
        const step = createStep(canale, tipo, steps.length);
        setSteps((prev) => [...prev, step]);
        setExpandedId(step.id);
      }
    }
  }

  const activePalette = (() => {
    if (!activeId?.startsWith("palette-")) return null;
    if (activeId.startsWith("palette-channel-")) {
      const canale = activeId.replace(
        "palette-channel-",
        "",
      ) as FunnelChannel;
      return CHANNELS.find((c) => c.canale === canale) ?? null;
    }
    if (activeId.startsWith("palette-mechanic-")) {
      const tipo = activeId.replace("palette-mechanic-", "") as FunnelStepKind;
      return MECHANICS.find((m) => m.tipo === tipo) ?? null;
    }
    return null;
  })();

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="stepsJson" value={JSON.stringify(payloadSteps)} />

      <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Impostazioni funnel</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nome"
            name="nome"
            required
            placeholder="Es. Riattivazione dormienti"
          />
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
          label="Meccanica complessiva"
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

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">Componi il funnel</h2>
          <p className="text-sm text-muted">
            Seleziona o trascina un <strong>canale</strong> e una{" "}
            <strong>meccanica</strong> sulla timeline. Trascina gli step per
            riordinarli; rilascia un pezzo su uno step per cambiarlo.
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Canali
                </p>
                <div className="mt-2 space-y-2">
                  {CHANNELS.map((c) => (
                    <PaletteChip
                      key={c.canale}
                      id={`palette-channel-${c.canale}`}
                      selected={selectedChannel === c.canale}
                      onSelect={() => setSelectedChannel(c.canale)}
                      payload={{ kind: "channel", canale: c.canale }}
                      icon={c.icon}
                      label={c.label}
                      hint={c.hint}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Meccaniche
                </p>
                <div className="mt-2 space-y-2">
                  {MECHANICS.map((m) => (
                    <PaletteChip
                      key={m.tipo}
                      id={`palette-mechanic-${m.tipo}`}
                      selected={selectedMechanic === m.tipo}
                      onSelect={() => setSelectedMechanic(m.tipo)}
                      payload={{ kind: "mechanic", tipo: m.tipo }}
                      icon={m.icon}
                      label={m.label}
                      hint={m.hint}
                    />
                  ))}
                </div>
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={addComposedStep}
                disabled={!selectedChannel || !selectedMechanic}
              >
                Aggiungi alla timeline
              </Button>
              {selectedChannel && selectedMechanic && (
                <p className="text-center text-xs text-muted">
                  {FUNNEL_CHANNEL_LABELS[selectedChannel]} ·{" "}
                  {FUNNEL_STEP_KIND_LABELS[selectedMechanic]}
                </p>
              )}
            </aside>

            <FunnelCanvas steps={steps}>
              {steps.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
                  <p className="font-medium">Timeline vuota</p>
                  <p className="mt-1 max-w-sm text-sm text-muted">
                    Trascina qui un canale o una meccanica, oppure selezionali
                    nella palette e clicca «Aggiungi alla timeline».
                  </p>
                </div>
              ) : (
                <SortableContext
                  items={steps.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="space-y-3">
                    {steps.map((step, index) => (
                      <SortableStepCard
                        key={step.id}
                        step={step}
                        index={index}
                        expanded={expandedId === step.id}
                        onToggle={() =>
                          setExpandedId((id) =>
                            id === step.id ? null : step.id,
                          )
                        }
                        onChange={(patch) => updateStep(step.id, patch)}
                        onRemove={() => removeStep(step.id)}
                      />
                    ))}
                  </ol>
                </SortableContext>
              )}
            </FunnelCanvas>
          </div>

          <DragOverlay>
            {activePalette ? (
              <div className="rounded-lg border border-accent bg-white px-3 py-2 text-sm shadow-lg">
                <span className="font-medium">{activePalette.label}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </section>

      {state && !state.success && (
        <p className="text-sm text-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={pending || steps.length === 0} size="lg">
        {pending ? "Salvataggio…" : "Crea funnel"}
      </Button>
    </form>
  );
}

function PaletteChip({
  id,
  selected,
  onSelect,
  payload,
  icon,
  label,
  hint,
}: {
  id: string;
  selected: boolean;
  onSelect: () => void;
  payload: PaletteDrag;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { source: "palette", payload },
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition",
        selected
          ? "border-accent bg-accent-soft text-accent"
          : "border-border bg-white hover:border-accent/40",
        isDragging && "opacity-40",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs opacity-80">{hint}</span>
      </span>
    </button>
  );
}

function FunnelCanvas({
  children,
  steps,
}: {
  children: React.ReactNode;
  steps: DraftStep[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "funnel-canvas",
    data: { accepts: "palette" },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-64 rounded-xl border border-border bg-slate-50/80 p-4 transition",
        isOver && "border-accent bg-accent-soft/40 ring-2 ring-accent/20",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Timeline funnel</p>
        <p className="text-xs text-muted">{steps.length} step</p>
      </div>
      {children}
    </div>
  );
}

function SortableStepCard({
  step,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  step: DraftStep;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<DraftStep>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.id,
    data: { source: "step" },
  });

  const dropId = `drop-${step.id}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={style}
      className={cn(
        "rounded-xl border bg-white shadow-sm",
        isDragging && "opacity-60",
        isOver ? "border-accent ring-2 ring-accent/20" : "border-border",
      )}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          className="mt-1 cursor-grab touch-none text-muted active:cursor-grabbing"
          aria-label="Trascina per riordinare"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Step {index + 1}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium">
              {FUNNEL_CHANNEL_LABELS[step.canale]}
            </span>
            <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
              {FUNNEL_STEP_KIND_LABELS[step.tipo]}
            </span>
            <span className="text-xs text-muted">{step.timingLabel}</span>
          </div>
          <p className="mt-1 truncate text-sm text-slate-600">
            {step.oggetto || step.corpo || "Clicca per compilare il contenuto…"}
          </p>
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-danger"
          aria-label="Rimuovi step"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Timing</span>
              <input
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.timingLabel}
                onChange={(e) => onChange({ timingLabel: e.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Offset giorni</span>
              <input
                type="number"
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.giornoOffset}
                onChange={(e) =>
                  onChange({ giornoOffset: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Oggetto</span>
            <input
              className="h-10 w-full rounded-lg border border-border px-3 text-sm"
              value={step.oggetto}
              onChange={(e) => onChange({ oggetto: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Corpo messaggio</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={step.corpo}
              onChange={(e) => onChange({ corpo: e.target.value })}
              placeholder="Testo dell'azione…"
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Offerta</span>
              <input
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.offerta}
                onChange={(e) => onChange({ offerta: e.target.value })}
                placeholder="Es. Tagliando -20% entro il 15/09"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Condizione</span>
              <input
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.condizione}
                onChange={(e) => onChange({ condizione: e.target.value })}
                placeholder="Es. Solo se non ha risposto"
              />
            </label>
          </div>
        </div>
      )}
    </li>
  );
}
